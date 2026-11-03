"""Model construction, optimiser parameter groups, EMA and checkpoint loading."""

from __future__ import annotations

import copy
from pathlib import Path

import timm
import timm.data
import torch
from torch import nn

from .config import TrainConfig
from .labels import CLASSES


def create_model(cfg: TrainConfig, pretrained: bool | None = None) -> nn.Module:
    kwargs = {"drop_rate": cfg.drop_rate}
    if cfg.drop_path > 0:
        kwargs["drop_path_rate"] = cfg.drop_path
    return timm.create_model(
        cfg.backbone,
        pretrained=cfg.pretrained if pretrained is None else pretrained,
        num_classes=len(CLASSES),
        **kwargs,
    )


def normalization(model: nn.Module) -> tuple[list[float], list[float]]:
    data_cfg = timm.data.resolve_data_config({}, model=model)
    return [float(v) for v in data_cfg["mean"]], [float(v) for v in data_cfg["std"]]


def param_groups(model: nn.Module, lr: float, head_lr_mult: float, weight_decay: float) -> list[dict]:
    """Higher learning rate for the new classifier head; no weight decay on biases and norms."""
    head_ids = {id(p) for p in model.get_classifier().parameters()}
    groups: dict[tuple[bool, bool], list[nn.Parameter]] = {}
    for p in model.parameters():
        if p.requires_grad:
            groups.setdefault((id(p) in head_ids, p.ndim > 1), []).append(p)
    return [
        {
            "params": params,
            "lr": lr * (head_lr_mult if is_head else 1.0),
            "weight_decay": weight_decay if decays else 0.0,
        }
        for (is_head, decays), params in groups.items()
    ]


class ModelEma:
    """Exponential moving average of model weights, with a short warm-up."""

    def __init__(self, model: nn.Module, decay: float):
        self.module = copy.deepcopy(model).eval()
        for p in self.module.parameters():
            p.requires_grad_(False)
        self.decay = decay

    @torch.no_grad()
    def update(self, model: nn.Module, step: int) -> None:
        decay = min(self.decay, (1 + step) / (10 + step))
        for ema_v, v in zip(self.module.state_dict().values(), model.state_dict().values(), strict=True):
            if ema_v.dtype.is_floating_point:
                ema_v.lerp_(v.detach(), 1.0 - decay)
            else:
                ema_v.copy_(v)


def load_trained(run_dir: Path, cfg: TrainConfig, device: torch.device) -> nn.Module:
    model = create_model(cfg, pretrained=False)
    checkpoint = torch.load(run_dir / "best.pt", map_location="cpu", weights_only=True)
    model.load_state_dict(checkpoint["state_dict"])
    return model.to(device).eval()


def resolve_device(name: str) -> torch.device:
    if name != "auto":
        return torch.device(name)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")
