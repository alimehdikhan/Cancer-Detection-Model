from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from app.labels import risk_level
from conftest import image_bytes


def upload(client, data: bytes, content_type: str = "image/jpeg", name: str = "lesion.jpg"):
    return client.post("/api/v1/predict", files={"file": (name, data, content_type)})


def noise_png(side: int) -> bytes:
    """Random pixels do not compress, so file size grows with side (~3 bytes per pixel)."""
    pixels = np.random.default_rng(0).integers(0, 256, size=(side, side, 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(pixels).save(buf, format="PNG")
    return buf.getvalue()


def test_health_reports_loaded_model(client):
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["model_version"].startswith("dev-untrained-")
    assert client.get("/api/v1/ready").status_code == 200


def test_model_info_and_etag(client):
    res = client.get("/api/v1/model")
    assert res.status_code == 200
    body = res.json()
    assert body["dev"] is True
    assert body["metrics"] is None
    assert body["tta"] is True and body["tta_views"] == 2
    assert [c["code"] for c in body["classes"]] == ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
    assert all(c["description"] for c in body["classes"])
    assert "max-age" in res.headers["cache-control"]

    again = client.get("/api/v1/model", headers={"If-None-Match": res.headers["etag"]})
    assert again.status_code == 304


def test_predict_returns_sorted_calibrated_distribution(client):
    res = upload(client, image_bytes())
    assert res.status_code == 200, res.text
    body = res.json()
    probs = [p["probability"] for p in body["predictions"]]
    assert len(probs) == 7
    assert probs == sorted(probs, reverse=True)
    assert sum(probs) == pytest.approx(1.0, abs=1e-4)
    assert body["top"] == body["predictions"][0]
    assert body["dev_model"] is True
    assert body["cached"] is False
    assert body["risk"]["level"] in {"high", "moderate", "low"}
    assert body["uncertain"] == (body["top"]["probability"] < 0.5)
    assert res.headers["x-cache"] == "MISS"
    assert "x-request-id" in res.headers
    assert res.headers["server-timing"].startswith("app;dur=")


def test_identical_upload_is_served_from_cache(client):
    data = image_bytes(color=(90, 60, 40))
    first = upload(client, data).json()
    second = upload(client, data)
    assert second.headers["x-cache"] == "HIT"
    body = second.json()
    assert body["cached"] is True
    assert body["predictions"] == first["predictions"]
    assert body["id"] == first["id"]


def test_different_images_get_different_predictions(client):
    a = upload(client, image_bytes(color=(250, 30, 30))).json()
    b = upload(client, image_bytes(color=(30, 30, 250))).json()
    assert a["predictions"] != b["predictions"]


@pytest.mark.parametrize(
    ("fmt", "mode", "content_type"),
    [("PNG", "RGBA", "image/png"), ("WEBP", "RGB", "image/webp"), ("PNG", "L", "image/png")],
)
def test_accepts_png_webp_alpha_and_grayscale(client, fmt, mode, content_type):
    color = (128, 128, 128) if mode != "L" else 128
    res = upload(client, image_bytes(fmt=fmt, mode=mode, color=color), content_type, f"x.{fmt.lower()}")
    assert res.status_code == 200, res.text


def test_rejects_unsupported_content_type(client):
    res = upload(client, b"hello", "text/plain", "notes.txt")
    assert res.status_code == 415


def test_rejects_disguised_format(client):
    res = upload(client, image_bytes(fmt="GIF"), "image/jpeg")
    assert res.status_code == 415


def test_rejects_corrupt_image(client):
    res = upload(client, b"\xff\xd8\xff not really a jpeg", "image/jpeg")
    assert res.status_code == 400
    assert "could not be read" in res.json()["detail"]


def test_rejects_empty_file(client):
    assert upload(client, b"").status_code == 400


def test_rejects_tiny_image(client):
    res = upload(client, image_bytes(size=(8, 8)))
    assert res.status_code == 400
    assert "too small" in res.json()["detail"]


@pytest.mark.parametrize("side", [100, 400])  # caught in the route / by the Content-Length check
def test_rejects_oversized_upload(make_client, side):
    client = make_client(max_upload_mb=0.01)
    res = upload(client, noise_png(side), "image/png")
    assert res.status_code == 413
    assert "larger than" in res.json()["detail"]


def test_without_model_api_is_degraded(make_client, tmp_path):
    client = make_client(model_dir=tmp_path / "missing")
    assert client.get("/api/v1/health").json() == {
        "status": "degraded",
        "model_loaded": False,
        "model_version": None,
    }
    assert client.get("/api/v1/ready").status_code == 503
    assert client.get("/api/v1/model").status_code == 503
    assert upload(client, image_bytes()).status_code == 503


@pytest.mark.parametrize(
    ("malignant", "top_category", "expected"),
    [
        (0.6, "benign", "high"),
        (0.1, "malignant", "high"),
        (0.25, "benign", "moderate"),
        (0.1, "precancerous", "moderate"),
        (0.1, "benign", "low"),
    ],
)
def test_risk_level(malignant, top_category, expected):
    assert risk_level(malignant, top_category) == expected
