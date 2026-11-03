"""End-to-end smoke test on a tiny synthetic HAM10000-shaped dataset.

Checks the full path train -> calibrate -> test evaluation -> ONNX export, that splits
never leak a lesion, and that the API preprocesses images exactly like training does.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
import pytest
from PIL import Image

from skin_ml import preprocess as ml_preprocess
from skin_ml.config import TrainConfig
from skin_ml.data import build_index, make_splits
from skin_ml.evaluate import finalize
from skin_ml.export import export_run
from skin_ml.labels import CLASSES
from skin_ml.train import train

API_PREPROCESS = Path(__file__).resolve().parents[2] / "api" / "app" / "preprocess.py"
COLORS = [(200, 60, 60), (60, 200, 60), (60, 60, 200), (200, 200, 60), (60, 60, 60), (200, 120, 60), (200, 60, 200)]


@pytest.fixture(scope="module")
def dataset(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """7 classes x 8 lesions x 2 photos, split across two folders like the Kaggle download."""
    root = tmp_path_factory.mktemp("ham")
    rng = np.random.default_rng(0)
    rows = []
    for c, code in enumerate(CLASSES):
        for lesion in range(8):
            for shot in range(2):
                image_id = f"ISIC_{c}{lesion:02d}{shot}"
                folder = root / ("HAM10000_images_part_1" if lesion % 2 else "HAM10000_images_part_2")
                folder.mkdir(exist_ok=True)
                pixels = np.clip(np.array(COLORS[c]) + rng.normal(0, 25, (45, 60, 3)), 0, 255).astype(np.uint8)
                Image.fromarray(pixels).save(folder / f"{image_id}.jpg")
                rows.append({"lesion_id": f"HAM_{c}{lesion:02d}", "image_id": image_id, "dx": code})
    pd.DataFrame(rows).assign(dx_type="histo", age=50.0, sex="male", localization="back").to_csv(
        root / "HAM10000_metadata.csv", index=False
    )
    return root


@pytest.fixture(scope="module")
def run_dir(dataset: Path, tmp_path_factory: pytest.TempPathFactory) -> Path:
    cfg = TrainConfig(
        data_dir=str(dataset),
        output_dir=str(tmp_path_factory.mktemp("run")),
        backbone="resnet18",
        pretrained=False,
        image_size=32,
        epochs=2,
        batch_size=16,
        warmup_epochs=0.5,
        ema_decay=0.9,
        num_workers=0,
        device="cpu",
        tta_views=2,
    )
    out = train(cfg)
    finalize(out, "cpu")
    export_run(out)
    return out


def test_splits_are_grouped_by_lesion(dataset: Path):
    df = make_splits(build_index(dataset), 0.15, 0.15, seed=0)
    assert set(df["split"]) == {"train", "val", "test"}
    assert (df.groupby("lesion_id")["split"].nunique() == 1).all()


def test_run_writes_all_artifacts(run_dir: Path):
    for name in ("config.json", "splits.csv", "history.json", "best.pt", "calibration.json", "metrics.json"):
        assert (run_dir / name).exists(), name
    metrics = json.loads((run_dir / "metrics.json").read_text())
    for key in ("accuracy", "balanced_accuracy", "macro_f1", "melanoma_recall", "per_class", "confusion_matrix"):
        assert key in metrics
    assert metrics["calibration"]["temperature"] > 0


def test_onnx_export_matches_contract(run_dir: Path):
    export = run_dir / "export"
    meta = json.loads((export / "model.json").read_text())
    assert meta["classes"] == list(CLASSES)
    assert meta["dev"] is False
    assert meta["image_size"] == 32 and meta["resize_size"] == 37
    assert meta["metrics"]["test_images"] > 0

    session = ort.InferenceSession(str(export / "model.onnx"), providers=["CPUExecutionProvider"])
    batch = np.zeros((3, 3, 32, 32), dtype=np.float32)  # dynamic batch size
    assert session.run(None, {"image": batch})[0].shape == (3, len(CLASSES))


def _load_api_preprocess():
    spec = importlib.util.spec_from_file_location("api_preprocess", API_PREPROCESS)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize("size", [(600, 450), (450, 600), (257, 256), (1024, 768)])
@pytest.mark.parametrize("mode", ["RGB", "RGBA", "L"])
def test_api_preprocessing_matches_training(size, mode):
    api = _load_api_preprocess()
    rng = np.random.default_rng(1)
    channels = {"RGB": 3, "RGBA": 4, "L": 1}[mode]
    pixels = rng.integers(0, 256, size=(size[1], size[0], channels), dtype=np.uint8).squeeze()
    img = Image.fromarray(pixels, mode=mode)
    args = (224, 256, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225])

    expected = ml_preprocess.eval_preprocess(img, *args)
    actual = api.eval_preprocess(img, *args)
    np.testing.assert_array_equal(actual, expected)
    for views in (1, 2, 4):
        np.testing.assert_array_equal(api.tta_batch(actual, views), ml_preprocess.tta_batch(expected, views))
