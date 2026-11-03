"""Dataset indexing, leak-free splitting, transforms and loaders."""

from __future__ import annotations

import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from sklearn.model_selection import StratifiedGroupKFold, train_test_split
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms as T

from .config import TrainConfig
from .labels import CLASSES
from .preprocess import eval_preprocess, load_rgb

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png"}


def build_index(data_dir: str | Path) -> pd.DataFrame:
    """Join HAM10000_metadata.csv with image paths found anywhere under data_dir."""
    data_dir = Path(data_dir)
    meta_path = next(data_dir.rglob("HAM10000_metadata.csv"), None)
    if meta_path is None:
        raise FileNotFoundError(
            f"HAM10000_metadata.csv not found under {data_dir}. "
            "Run `python -m skin_ml.download` first."
        )
    df = pd.read_csv(meta_path)

    paths: dict[str, str] = {}
    for p in sorted(data_dir.rglob("*")):
        if p.suffix.lower() in IMAGE_SUFFIXES:
            paths.setdefault(p.stem, str(p))
    df["path"] = df["image_id"].map(paths)

    missing = int(df["path"].isna().sum())
    if missing:
        print(f"warning: {missing} images listed in the metadata were not found; skipping them")
        df = df.dropna(subset=["path"])

    unknown = set(df["dx"]) - set(CLASSES)
    if unknown:
        raise ValueError(f"unexpected diagnosis codes: {sorted(unknown)}")
    df["label"] = df["dx"].map({c: i for i, c in enumerate(CLASSES)}).astype(int)
    return df.reset_index(drop=True)


def subsample(df: pd.DataFrame, n: int, seed: int) -> pd.DataFrame:
    if n <= 0 or n >= len(df):
        return df
    subset, _ = train_test_split(df, train_size=n, stratify=df["label"], random_state=seed)
    return subset.reset_index(drop=True)


def _one_fold(df: pd.DataFrame, fraction: float, seed: int) -> pd.Index:
    n_splits = max(2, round(1 / fraction))
    sgkf = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    _, held_out = next(sgkf.split(df, df["label"], groups=df["lesion_id"]))
    return df.index[held_out]


def make_splits(df: pd.DataFrame, val_fraction: float, test_fraction: float, seed: int) -> pd.DataFrame:
    """Train/val/test split stratified by diagnosis and grouped by lesion.

    Grouping by lesion_id keeps every photo of a lesion in one split, so the model is
    never tested on a lesion it has already seen.
    """
    df = df.copy()
    df["split"] = "train"
    df.loc[_one_fold(df, test_fraction, seed), "split"] = "test"
    rest = df[df["split"] == "train"]
    df.loc[_one_fold(rest, val_fraction / (1 - test_fraction), seed + 1), "split"] = "val"

    lesions = {s: set(df.loc[df["split"] == s, "lesion_id"]) for s in ("train", "val", "test")}
    if lesions["train"] & lesions["val"] or lesions["train"] & lesions["test"] or lesions["val"] & lesions["test"]:
        raise AssertionError("a lesion appears in more than one split")
    return df


def split_summary(df: pd.DataFrame) -> pd.DataFrame:
    table = pd.crosstab(df["dx"], df["split"]).reindex(index=list(CLASSES), columns=["train", "val", "test"])
    table.loc["total"] = table.sum()
    return table.fillna(0).astype(int)


class RandomRot90:
    """Rotate by a random multiple of 90°. Lesions have no canonical orientation."""

    _ops = (Image.Transpose.ROTATE_90, Image.Transpose.ROTATE_180, Image.Transpose.ROTATE_270)

    def __call__(self, img: Image.Image) -> Image.Image:
        k = random.randrange(4)
        return img if k == 0 else img.transpose(self._ops[k - 1])


class EvalTransform:
    def __init__(self, cfg: TrainConfig, mean: list[float], std: list[float]):
        self.args = (cfg.image_size, cfg.resize_size, mean, std)

    def __call__(self, img: Image.Image) -> torch.Tensor:
        return torch.from_numpy(eval_preprocess(img, *self.args))


def train_transform(cfg: TrainConfig, mean: list[float], std: list[float]) -> T.Compose:
    return T.Compose(
        [
            T.RandomResizedCrop(cfg.image_size, scale=(0.4, 1.0), ratio=(0.75, 1.333)),
            T.RandomHorizontalFlip(),
            T.RandomVerticalFlip(),
            RandomRot90(),
            T.RandomApply([T.ColorJitter(0.2, 0.2, 0.15, 0.03)], p=0.8),
            T.ToTensor(),
            T.Normalize(mean, std),
        ]
    )


class LesionDataset(Dataset):
    def __init__(self, frame: pd.DataFrame, transform):
        self.paths = frame["path"].tolist()
        self.labels = frame["label"].tolist()
        self.transform = transform

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, i: int) -> tuple[torch.Tensor, int]:
        with Image.open(self.paths[i]) as img:
            img = load_rgb(img)
        return self.transform(img), self.labels[i]


def class_weights(labels: np.ndarray, num_classes: int, power: float) -> torch.Tensor:
    """Inverse-frequency weights raised to `power`, scaled so the average sample weight is 1."""
    counts = np.maximum(np.bincount(labels, minlength=num_classes).astype(np.float64), 1)
    w = (counts.sum() / counts) ** power
    w *= counts.sum() / (w * counts).sum()
    return torch.tensor(w, dtype=torch.float32)


def make_loader(
    frame: pd.DataFrame, transform, batch_size: int, num_workers: int, train: bool, pin_memory: bool
) -> DataLoader:
    return DataLoader(
        LesionDataset(frame, transform),
        batch_size=batch_size,
        shuffle=train,
        drop_last=train,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=num_workers > 0,
    )
