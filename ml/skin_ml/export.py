"""Export a trained run to ONNX plus the model.json the API reads.

    python -m skin_ml.export --run-dir runs/latest --dest ../models/current
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

from .config import TrainConfig
from .labels import CLASSES
from .modeling import load_trained

METRIC_KEYS = (
    "test_images",
    "accuracy",
    "balanced_accuracy",
    "macro_f1",
    "auc_macro",
    "melanoma_recall",
    "malignant",
    "ece",
    "per_class",
)


def _onnx_export(model: torch.nn.Module, dummy: torch.Tensor, path: Path, opset: int) -> None:
    kwargs = dict(
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=opset,
    )
    try:
        torch.onnx.export(model, (dummy,), str(path), dynamo=False, **kwargs)
    except TypeError:  # torch < 2.5 has no `dynamo` argument
        torch.onnx.export(model, (dummy,), str(path), **kwargs)


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def export_run(run_dir: Path, dest: Path | None = None, opset: int = 17) -> Path:
    cfg = TrainConfig.load(run_dir / "config.json")
    extra = json.loads((run_dir / "config.json").read_text())
    calibration = json.loads((run_dir / "calibration.json").read_text())
    metrics_path = run_dir / "metrics.json"
    metrics = json.loads(metrics_path.read_text()) if metrics_path.exists() else None

    out = dest or run_dir / "export"
    out.mkdir(parents=True, exist_ok=True)
    onnx_path = out / "model.onnx"

    model = load_trained(run_dir, cfg, torch.device("cpu"))
    dummy = torch.randn(2, 3, cfg.image_size, cfg.image_size)
    _onnx_export(model, dummy, onnx_path, opset)

    # The exported graph must reproduce PyTorch's output.
    with torch.no_grad():
        expected = model(dummy).numpy()
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    actual = session.run(None, {"image": dummy.numpy()})[0]
    max_diff = float(np.abs(expected - actual).max())
    if max_diff > 1e-3:
        raise RuntimeError(f"ONNX output differs from PyTorch by {max_diff:.2e}")

    sha = _sha256(onnx_path)
    created = datetime.now(timezone.utc)
    meta = {
        "version": f"{cfg.backbone.split('.')[0]}-{created:%Y%m%d}-{sha[:8]}",
        "backbone": cfg.backbone,
        "dev": False,
        "image_size": cfg.image_size,
        "resize_size": cfg.resize_size,
        "mean": extra["mean"],
        "std": extra["std"],
        "classes": list(CLASSES),
        "input_name": "image",
        "output_name": "logits",
        "temperature": calibration["temperature"],
        "tta_views": calibration["tta_views"],
        "trained_at": created.isoformat(timespec="seconds"),
        "sha256": sha,
        "metrics": {k: metrics[k] for k in METRIC_KEYS if k in metrics} if metrics else None,
    }
    (out / "model.json").write_text(json.dumps(meta, indent=2))
    if metrics_path.exists():
        shutil.copyfile(metrics_path, out / "metrics.json")

    size_mb = onnx_path.stat().st_size / 1e6
    print(f"\nExported {meta['version']} ({size_mb:.1f} MB, max diff vs PyTorch {max_diff:.1e}) to {out}")
    return out


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--dest", type=Path, default=None, help="defaults to <run-dir>/export")
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args(argv)
    export_run(args.run_dir, args.dest, args.opset)


if __name__ == "__main__":
    main()
