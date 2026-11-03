"""Calibrate on the validation set and evaluate once on the held-out test set.

    python -m skin_ml.evaluate --run-dir runs/latest
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader

from .config import TrainConfig
from .data import EvalTransform, make_loader
from .labels import CLASSES
from .metrics import compute_metrics, expected_calibration_error, fit_temperature, nll, softmax
from .modeling import load_trained, resolve_device


def tta_views(images: torch.Tensor, views: int) -> list[torch.Tensor]:
    """Same views, in the same order, as preprocess.tta_batch."""
    candidates = (
        lambda x: x,
        lambda x: x.flip(3),
        lambda x: x.flip(2),
        lambda x: x.flip(2, 3),
    )
    return [f(images) for f in candidates[: max(1, min(views, 4))]]


@torch.no_grad()
def predict_logits(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    views: int = 1,
    amp: bool = False,
    channels_last: bool = False,
) -> tuple[np.ndarray, np.ndarray]:
    """Logits averaged over TTA views, plus the true labels."""
    model.eval()
    all_logits, all_labels = [], []
    for images, labels in loader:
        images = images.to(device, non_blocking=True)
        if channels_last:
            images = images.contiguous(memory_format=torch.channels_last)
        with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=amp):
            logits = torch.stack([model(v).float() for v in tta_views(images, views)]).mean(0)
        all_logits.append(logits.cpu())
        all_labels.append(labels)
    return torch.cat(all_logits).numpy(), torch.cat(all_labels).numpy()


def finalize(run_dir: Path, device_name: str = "auto", views: int | None = None) -> dict:
    """Fit temperature on val, evaluate on test, write calibration.json and metrics.json."""
    cfg = TrainConfig.load(run_dir / "config.json")
    extra = json.loads((run_dir / "config.json").read_text())
    views = cfg.tta_views if views is None else views
    device = resolve_device(device_name if device_name != "auto" else cfg.device)
    amp = cfg.amp and device.type == "cuda"
    channels_last = cfg.channels_last and device.type == "cuda"

    model = load_trained(run_dir, cfg, device)
    if channels_last:
        model = model.to(memory_format=torch.channels_last)

    splits = pd.read_csv(run_dir / "splits.csv")
    transform = EvalTransform(cfg, extra["mean"], extra["std"])

    def logits_for(split: str) -> tuple[np.ndarray, np.ndarray]:
        loader = make_loader(
            splits[splits["split"] == split],
            transform,
            batch_size=cfg.batch_size * 2,
            num_workers=cfg.num_workers,
            train=False,
            pin_memory=device.type == "cuda",
        )
        return predict_logits(model, loader, device, views, amp, channels_last)

    val_logits, val_y = logits_for("val")
    temperature = fit_temperature(val_logits, val_y)
    calibration = {
        "temperature": temperature,
        "tta_views": views,
        "val_nll_before": nll(val_y, softmax(val_logits)),
        "val_nll_after": nll(val_y, softmax(val_logits, temperature)),
        "val_ece_before": expected_calibration_error(val_y, softmax(val_logits)),
        "val_ece_after": expected_calibration_error(val_y, softmax(val_logits, temperature)),
    }
    (run_dir / "calibration.json").write_text(json.dumps(calibration, indent=2))

    test_logits, test_y = logits_for("test")
    metrics = compute_metrics(test_y, softmax(test_logits, temperature), CLASSES)
    metrics["calibration"] = calibration
    metrics["split_sizes"] = {str(k): int(v) for k, v in splits["split"].value_counts().items()}
    checkpoint = torch.load(run_dir / "best.pt", map_location="cpu", weights_only=True)
    metrics["best_epoch"] = int(checkpoint["epoch"])
    (run_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print_report(metrics)
    return metrics


def print_report(m: dict) -> None:
    def pct(v: float | None) -> str:
        return "n/a" if v is None else f"{v:.1%}"

    print("\nHeld-out test set")
    print(f"  images             {m['test_images']}")
    print(f"  accuracy           {pct(m['accuracy'])}")
    print(f"  balanced accuracy  {pct(m['balanced_accuracy'])}")
    print(f"  macro F1           {pct(m['macro_f1'])}")
    print(f"  macro ROC-AUC      {pct(m['auc_macro'])}")
    print(f"  melanoma recall    {pct(m['melanoma_recall'])}")
    print(f"  malignant AUC      {pct(m['malignant']['auc'])}")
    print(f"  calibration (ECE)  {m['ece']:.3f}  (T = {m['calibration']['temperature']:.2f})")
    print("\n  class   precision  recall   f1     n")
    for code, r in m["per_class"].items():
        print(f"  {code:<6}  {r['precision']:>8.1%}  {r['recall']:>6.1%}  {r['f1']:>5.1%}  {r['support']:>4}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--tta-views", type=int, default=None)
    args = parser.parse_args(argv)
    finalize(args.run_dir, args.device, args.tta_views)


if __name__ == "__main__":
    main()
