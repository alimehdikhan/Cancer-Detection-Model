"""Train, calibrate, evaluate on the test set and export, in one command.

    python -m skin_ml.train --data-dir data/ham10000 --output-dir runs/convnext
    python -m skin_ml.train --help   # every option
"""

from __future__ import annotations

import json
import math
import random
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.optim.lr_scheduler import LambdaLR
from tqdm import tqdm

from .config import TrainConfig, parse_args
from .data import (
    EvalTransform,
    build_index,
    class_weights,
    make_loader,
    make_splits,
    split_summary,
    subsample,
    train_transform,
)
from .evaluate import finalize, predict_logits
from .export import export_run
from .labels import CLASSES
from .metrics import compute_metrics, nll, softmax
from .modeling import ModelEma, create_model, normalization, param_groups, resolve_device


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def warmup_cosine(total_steps: int, warmup_steps: int, min_ratio: float):
    def factor(step: int) -> float:
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return min_ratio + (1 - min_ratio) * 0.5 * (1 + math.cos(math.pi * min(progress, 1.0)))

    return factor


def train(cfg: TrainConfig) -> Path:
    seed_everything(cfg.seed)
    out = Path(cfg.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    device = resolve_device(cfg.device)
    use_amp = cfg.amp and device.type == "cuda"
    channels_last = cfg.channels_last and device.type == "cuda"
    if device.type == "cuda":
        torch.backends.cudnn.benchmark = True
    print(f"device: {device}  amp: {use_amp}")

    # Data: leak-free split, saved so evaluation and later runs use the same partition.
    df = subsample(build_index(cfg.data_dir), cfg.limit, cfg.seed)
    df = make_splits(df, cfg.val_fraction, cfg.test_fraction, cfg.seed)
    df.to_csv(out / "splits.csv", index=False)
    print("\nImages per split (grouped by lesion, stratified by diagnosis):")
    print(split_summary(df).to_string(), "\n")

    model = create_model(cfg).to(device)
    if channels_last:
        model = model.to(memory_format=torch.channels_last)
    mean, std = normalization(model)
    cfg.save(out / "config.json", mean=mean, std=std, classes=list(CLASSES), resize_size=cfg.resize_size)

    train_df, val_df = df[df["split"] == "train"], df[df["split"] == "val"]
    pin = device.type == "cuda"
    train_loader = make_loader(train_df, train_transform(cfg, mean, std), cfg.batch_size, cfg.num_workers, True, pin)
    val_loader = make_loader(val_df, EvalTransform(cfg, mean, std), cfg.batch_size * 2, cfg.num_workers, False, pin)

    weights = class_weights(train_df["label"].to_numpy(), len(CLASSES), cfg.class_weight_power)
    print("class weights:", dict(zip(CLASSES, (round(w, 2) for w in weights.tolist()), strict=True)))
    criterion = nn.CrossEntropyLoss(weight=weights.to(device), label_smoothing=cfg.label_smoothing)
    optimizer = torch.optim.AdamW(param_groups(model, cfg.lr, cfg.head_lr_mult, cfg.weight_decay))
    steps_per_epoch = len(train_loader)
    total_steps = steps_per_epoch * cfg.epochs
    warmup_steps = max(1, int(cfg.warmup_epochs * steps_per_epoch))
    scheduler = LambdaLR(optimizer, warmup_cosine(total_steps, warmup_steps, cfg.min_lr_ratio))
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
    ema = ModelEma(model, cfg.ema_decay) if cfg.ema_decay > 0 else None

    history: list[dict] = []
    best_score, best_epoch, step = -1.0, 0, 0
    for epoch in range(1, cfg.epochs + 1):
        started = time.perf_counter()
        model.train()
        running, seen = 0.0, 0
        bar = tqdm(train_loader, desc=f"epoch {epoch}/{cfg.epochs}", leave=False)
        for images, labels in bar:
            images = images.to(device, non_blocking=True)
            if channels_last:
                images = images.contiguous(memory_format=torch.channels_last)
            labels = labels.to(device, non_blocking=True)

            with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
                loss = criterion(model(images), labels)
            optimizer.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            if cfg.grad_clip > 0:
                scaler.unscale_(optimizer)
                nn.utils.clip_grad_norm_(model.parameters(), cfg.grad_clip)
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            if ema is not None:
                ema.update(model, step)
            step += 1

            running += loss.item() * len(labels)
            seen += len(labels)
            bar.set_postfix(loss=f"{running / seen:.3f}")

        eval_model = ema.module if ema is not None else model
        val_logits, val_y = predict_logits(eval_model, val_loader, device, 1, use_amp, channels_last)
        val_probs = softmax(val_logits)
        m = compute_metrics(val_y, val_probs, CLASSES)
        record = {
            "epoch": epoch,
            "train_loss": running / max(seen, 1),
            "val_loss": nll(val_y, val_probs),
            "val_accuracy": m["accuracy"],
            "val_balanced_accuracy": m["balanced_accuracy"],
            "val_macro_f1": m["macro_f1"],
            "val_melanoma_recall": m["melanoma_recall"],
            "lr": optimizer.param_groups[0]["lr"],
            "seconds": round(time.perf_counter() - started, 1),
        }
        history.append(record)
        (out / "history.json").write_text(json.dumps(history, indent=2))

        improved = m["balanced_accuracy"] > best_score
        if improved:
            best_score, best_epoch = m["balanced_accuracy"], epoch
            torch.save(
                {"state_dict": eval_model.state_dict(), "epoch": epoch, "val": record, "config": asdict(cfg)},
                out / "best.pt",
            )
        print(
            f"epoch {epoch:>2}  loss {record['train_loss']:.3f}  val_loss {record['val_loss']:.3f}  "
            f"acc {m['accuracy']:.3f}  bal_acc {m['balanced_accuracy']:.3f}  "
            f"mel_recall {m['melanoma_recall']:.3f}  {record['seconds']}s" + ("  *" if improved else "")
        )
        if epoch - best_epoch >= cfg.patience:
            print(f"Early stopping: no improvement for {cfg.patience} epochs.")
            break

    print(f"\nBest validation balanced accuracy {best_score:.3f} at epoch {best_epoch}")
    return out


def main(argv: list[str] | None = None) -> None:
    cfg = parse_args(argv)
    run_dir = train(cfg)
    finalize(run_dir, cfg.device)
    export_dir = export_run(run_dir)
    print(f"To serve this model, copy {export_dir}/model.onnx and model.json into models/current/.")


if __name__ == "__main__":
    main()
