from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402
from make_dev_model import build_dev_model  # noqa: E402


@pytest.fixture(scope="session")
def model_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return build_dev_model(tmp_path_factory.mktemp("model"))


@pytest.fixture
def make_client(model_dir: Path):
    clients: list[TestClient] = []

    def factory(**overrides) -> TestClient:
        settings = Settings(**{"model_dir": model_dir, "redis_url": None, **overrides})
        client = TestClient(create_app(settings))
        client.__enter__()  # runs the lifespan, which loads the model
        clients.append(client)
        return client

    yield factory
    for client in clients:
        client.__exit__(None, None, None)


@pytest.fixture
def client(make_client) -> TestClient:
    return make_client()


def image_bytes(fmt: str = "JPEG", size=(300, 200), color=(200, 120, 90), mode: str = "RGB") -> bytes:
    if mode == "RGBA":
        color = (*color, 128)
    buf = io.BytesIO()
    Image.new(mode, size, color).save(buf, format=fmt)
    return buf.getvalue()
