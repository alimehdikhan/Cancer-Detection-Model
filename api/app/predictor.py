"""Loads the exported ONNX model and turns image bytes into calibrated probabilities."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import numpy as np
import onnxruntime as ort

from .labels import CLASS_INFO, MALIGNANT_GROUP, UNCERTAIN_BELOW, risk_level
from .preprocess import decode_image, eval_preprocess, tta_batch

log = logging.getLogger("app.predictor")


class Predictor:
    def __init__(self, model_dir: Path, tta_views: int | None = None, threads: int = 1):
        self.meta: dict = json.loads((model_dir / "model.json").read_text(encoding="utf-8"))
        self.classes: list[str] = list(self.meta["classes"])
        unknown = [c for c in self.classes if c not in CLASS_INFO]
        if unknown:
            raise ValueError(f"model.json lists unknown classes: {unknown}")

        options = ort.SessionOptions()
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        options.intra_op_num_threads = threads
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            str(model_dir / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"]
        )
        self.input_name: str = self.meta.get("input_name") or self.session.get_inputs()[0].name

        self.version: str = self.meta["version"]
        self.is_dev: bool = bool(self.meta.get("dev", False))
        self.image_size: int = int(self.meta["image_size"])
        self.resize_size: int = int(self.meta["resize_size"])
        self.mean: list[float] = self.meta["mean"]
        self.std: list[float] = self.meta["std"]
        self.temperature: float = float(self.meta.get("temperature", 1.0))
        self.tta_views: int = int(tta_views or self.meta.get("tta_views", 1))

    def warmup(self) -> None:
        dummy = np.zeros((self.tta_views, 3, self.image_size, self.image_size), dtype=np.float32)
        self.session.run(None, {self.input_name: dummy})
        log.info("model ready", extra={"fields": {"version": self.version, "tta_views": self.tta_views}})

    def probabilities(self, data: bytes) -> np.ndarray:
        """Decode, preprocess, run every TTA view in one batch, return calibrated probabilities."""
        x = eval_preprocess(decode_image(data), self.image_size, self.resize_size, self.mean, self.std)
        logits = self.session.run(None, {self.input_name: tta_batch(x, self.tta_views)})[0]
        z = logits.astype(np.float64).mean(axis=0) / self.temperature
        e = np.exp(z - z.max())
        return e / e.sum()

    def predict(self, data: bytes, image_id: str) -> dict:
        probs = self.probabilities(data)
        predictions = sorted(
            (
                {
                    "code": code,
                    "name": CLASS_INFO[code].name,
                    "category": CLASS_INFO[code].category,
                    "probability": round(float(p), 6),
                }
                for code, p in zip(self.classes, probs, strict=True)
            ),
            key=lambda item: item["probability"],
            reverse=True,
        )
        top = predictions[0]
        malignant = float(sum(p for code, p in zip(self.classes, probs, strict=True) if code in MALIGNANT_GROUP))
        return {
            "id": image_id,
            "model_version": self.version,
            "dev_model": self.is_dev,
            "uncertain": top["probability"] < UNCERTAIN_BELOW,
            "top": top,
            "predictions": predictions,
            "risk": {
                "level": risk_level(malignant, top["category"]),
                "malignant_probability": round(malignant, 6),
            },
        }

    def info(self) -> dict:
        return {
            "version": self.version,
            "backbone": self.meta.get("backbone", "unknown"),
            "image_size": self.image_size,
            "dev": self.is_dev,
            "tta": self.tta_views > 1,
            "tta_views": self.tta_views,
            "trained_at": self.meta.get("trained_at"),
            "classes": [
                {
                    "code": code,
                    "name": CLASS_INFO[code].name,
                    "category": CLASS_INFO[code].category,
                    "description": CLASS_INFO[code].description,
                }
                for code in self.classes
            ],
            "metrics": self.meta.get("metrics"),
        }
