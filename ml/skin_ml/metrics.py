"""Evaluation metrics and temperature calibration."""

from __future__ import annotations

import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)

from .labels import MALIGNANT_GROUP

MALIGNANT_THRESHOLD = 0.5


def softmax(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    z = logits / temperature
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)


def nll(y_true: np.ndarray, probs: np.ndarray) -> float:
    return float(-np.log(np.clip(probs[np.arange(len(y_true)), y_true], 1e-12, 1.0)).mean())


def expected_calibration_error(y_true: np.ndarray, probs: np.ndarray, bins: int = 15) -> float:
    conf = probs.max(axis=1)
    correct = probs.argmax(axis=1) == y_true
    edges = np.linspace(0.0, 1.0, bins + 1)
    ece = 0.0
    for lo, hi in zip(edges[:-1], edges[1:], strict=True):
        in_bin = (conf > lo) & (conf <= hi)
        if in_bin.any():
            ece += in_bin.mean() * abs(correct[in_bin].mean() - conf[in_bin].mean())
    return float(ece)


def _safe_auc(y: np.ndarray, scores: np.ndarray, **kwargs) -> float | None:
    try:
        return float(roc_auc_score(y, scores, **kwargs))
    except ValueError:  # a class is missing from y
        return None


def compute_metrics(y_true: np.ndarray, probs: np.ndarray, classes: tuple[str, ...]) -> dict:
    labels = list(range(len(classes)))
    y_pred = probs.argmax(axis=1)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0
    )
    per_class = {
        c: {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i, c in enumerate(classes)
    }

    malignant_idx = [classes.index(c) for c in MALIGNANT_GROUP]
    is_malignant = np.isin(y_true, malignant_idx)
    malignant_score = probs[:, malignant_idx].sum(axis=1)
    flagged = malignant_score >= MALIGNANT_THRESHOLD

    return {
        "test_images": int(len(y_true)),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0)),
        "auc_macro": _safe_auc(y_true, probs, multi_class="ovr", average="macro", labels=labels),
        "melanoma_recall": per_class["mel"]["recall"],
        "malignant": {
            "auc": _safe_auc(is_malignant, malignant_score),
            "threshold": MALIGNANT_THRESHOLD,
            "sensitivity": float(flagged[is_malignant].mean()) if is_malignant.any() else None,
            "specificity": float((~flagged[~is_malignant]).mean()) if (~is_malignant).any() else None,
        },
        "nll": nll(y_true, probs),
        "ece": expected_calibration_error(y_true, probs),
        "per_class": per_class,
        "classes": list(classes),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
    }


def fit_temperature(logits: np.ndarray, y_true: np.ndarray) -> float:
    """Find T minimising validation NLL of softmax(logits / T)."""
    z = torch.tensor(logits, dtype=torch.float64)
    y = torch.tensor(y_true, dtype=torch.long)
    log_t = torch.zeros(1, dtype=torch.float64, requires_grad=True)
    opt = torch.optim.LBFGS([log_t], lr=0.1, max_iter=500, line_search_fn="strong_wolfe")

    def closure() -> torch.Tensor:
        opt.zero_grad()
        loss = F.cross_entropy(z / log_t.exp(), y)
        loss.backward()
        return loss

    opt.step(closure)
    return float(log_t.exp().clamp(0.05, 20.0).item())
