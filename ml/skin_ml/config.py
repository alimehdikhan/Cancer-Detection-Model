"""Training configuration. Every field is also a command-line flag (e.g. --image-size 288)."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, fields
from pathlib import Path


@dataclass
class TrainConfig:
    data_dir: str = "data/ham10000"
    output_dir: str = "runs/latest"

    # Model. EfficientNet-B2 is the default because it is fast on CPU with ONNX Runtime
    # (~20 ms per image); ConvNeXt-Tiny is a strong option when serving on a GPU.
    backbone: str = "efficientnet_b2.ra_in1k"
    pretrained: bool = True
    image_size: int = 256
    crop_pct: float = 0.875  # eval: resize shorter side to image_size / crop_pct, then centre-crop
    drop_rate: float = 0.2  # dropout before the classifier
    drop_path: float = 0.1

    # Optimisation
    epochs: int = 30
    batch_size: int = 32
    lr: float = 2e-4
    head_lr_mult: float = 5.0
    weight_decay: float = 0.02
    warmup_epochs: float = 1.0
    min_lr_ratio: float = 0.01
    label_smoothing: float = 0.1
    class_weight_power: float = 0.5  # 0 = unweighted, 1 = full inverse frequency
    ema_decay: float = 0.999  # 0 disables the EMA copy of the weights
    grad_clip: float = 1.0
    patience: int = 8

    # Data
    val_fraction: float = 0.15
    test_fraction: float = 0.15
    limit: int = 0  # >0 trains on a random subset, for quick debugging
    num_workers: int = 4

    # Inference
    tta_views: int = 2  # 1 = none, 2 = + horizontal flip, 4 = + vertical and both flips

    # Runtime
    amp: bool = True
    channels_last: bool = True
    device: str = "auto"
    seed: int = 42

    @property
    def resize_size(self) -> int:
        return int(round(self.image_size / self.crop_pct))

    def save(self, path: Path, **extra: object) -> None:
        path.write_text(json.dumps({**asdict(self), **extra}, indent=2))

    @classmethod
    def load(cls, path: Path) -> TrainConfig:
        data = json.loads(path.read_text())
        known = {f.name for f in fields(cls)}
        return cls(**{k: v for k, v in data.items() if k in known})


def parse_args(argv: list[str] | None = None) -> TrainConfig:
    parser = argparse.ArgumentParser(description="Train the skin lesion classifier.")
    defaults = TrainConfig()
    for f in fields(TrainConfig):
        flag = "--" + f.name.replace("_", "-")
        default = getattr(defaults, f.name)
        if isinstance(default, bool):
            parser.add_argument(flag, action=argparse.BooleanOptionalAction, default=default)
        else:
            parser.add_argument(flag, type=type(default), default=default)
    return TrainConfig(**vars(parser.parse_args(argv)))
