"""Write a tiny UNTRAINED ONNX model so the API and web app can run before real training.

Its predictions are meaningless; the API and UI flag it as a development model.

    python api/scripts/make_dev_model.py               # writes models/current/
    python api/scripts/make_dev_model.py --out other/dir
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper

CLASSES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def build_dev_model(out_dir: Path, image_size: int = 224, seed: int = 0) -> Path:
    """Global average pool over RGB, then a random linear layer: output depends on image colour."""
    rng = np.random.default_rng(seed)
    weight = rng.normal(0.0, 2.0, size=(3, len(CLASSES))).astype(np.float32)
    bias = rng.normal(0.0, 0.5, size=(len(CLASSES),)).astype(np.float32)

    graph = helper.make_graph(
        [
            helper.make_node("GlobalAveragePool", ["image"], ["pooled"]),
            helper.make_node("Flatten", ["pooled"], ["features"], axis=1),
            helper.make_node("Gemm", ["features", "weight", "bias"], ["logits"]),
        ],
        "dev_model",
        inputs=[helper.make_tensor_value_info("image", TensorProto.FLOAT, ["batch", 3, image_size, image_size])],
        outputs=[helper.make_tensor_value_info("logits", TensorProto.FLOAT, ["batch", len(CLASSES)])],
        initializer=[numpy_helper.from_array(weight, "weight"), numpy_helper.from_array(bias, "bias")],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)], producer_name="dev-model")
    model.ir_version = 8  # loadable by older ONNX Runtime releases too
    onnx.checker.check_model(model)

    out_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = out_dir / "model.onnx"
    onnx.save(model, onnx_path)
    sha = hashlib.sha256(onnx_path.read_bytes()).hexdigest()

    meta = {
        "version": f"dev-untrained-{sha[:8]}",
        "backbone": "dev-linear",
        "dev": True,
        "image_size": image_size,
        "resize_size": int(round(image_size / 0.875)),
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
        "classes": CLASSES,
        "input_name": "image",
        "output_name": "logits",
        "temperature": 1.0,
        "tta_views": 2,
        "trained_at": None,
        "sha256": sha,
        "metrics": None,
    }
    (out_dir / "model.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return out_dir


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("models/current"))
    args = parser.parse_args()
    if (args.out / "model.json").exists():
        existing = json.loads((args.out / "model.json").read_text(encoding="utf-8"))
        if not existing.get("dev"):
            raise SystemExit(f"{args.out} holds a trained model ({existing['version']}); refusing to overwrite it.")
    build_dev_model(args.out)
    print(f"Wrote an untrained development model to {args.out}")


if __name__ == "__main__":
    main()
