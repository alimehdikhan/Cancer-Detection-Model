"""Image decoding and preprocessing.

eval_preprocess and tta_batch must stay identical to ml/skin_ml/preprocess.py, which
the model was trained and evaluated with. ml/tests/test_pipeline.py checks this.
"""

from __future__ import annotations

import io
from collections.abc import Sequence

import numpy as np
from PIL import Image, ImageOps

ALLOWED_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
MAX_PIXELS = 40_000_000
MIN_SIDE = 32

Image.MAX_IMAGE_PIXELS = MAX_PIXELS


class InvalidImage(ValueError):
    """The upload is not a usable image (HTTP 400)."""


class UnsupportedImage(InvalidImage):
    """The upload is an image in a format we do not accept (HTTP 415)."""


def decode_image(data: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ALLOWED_FORMATS:
            raise UnsupportedImage(f"Unsupported image format ({img.format}). Use JPEG, PNG or WebP.")
        if img.width * img.height > MAX_PIXELS:
            raise InvalidImage("The image has too many pixels.")
        img.load()
    except InvalidImage:
        raise
    except Image.DecompressionBombError as exc:
        raise InvalidImage("The image has too many pixels.") from exc
    except Exception as exc:
        raise InvalidImage("The file could not be read as an image.") from exc
    if min(img.size) < MIN_SIDE:
        raise InvalidImage(f"The image is too small. It must be at least {MIN_SIDE} px on each side.")
    return img


def load_rgb(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return img.convert("RGB")


def resize_and_center_crop(img: Image.Image, image_size: int, resize_size: int) -> Image.Image:
    w, h = img.size
    scale = resize_size / min(w, h)
    new_w = max(resize_size, int(round(w * scale)))
    new_h = max(resize_size, int(round(h * scale)))
    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    left = (new_w - image_size) // 2
    top = (new_h - image_size) // 2
    return img.crop((left, top, left + image_size, top + image_size))


def normalize(img: Image.Image, mean: Sequence[float], std: Sequence[float]) -> np.ndarray:
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - np.asarray(mean, dtype=np.float32)) / np.asarray(std, dtype=np.float32)
    return np.ascontiguousarray(arr.transpose(2, 0, 1))


def eval_preprocess(
    img: Image.Image,
    image_size: int,
    resize_size: int,
    mean: Sequence[float],
    std: Sequence[float],
) -> np.ndarray:
    """Return a normalised (3, H, W) float32 array."""
    return normalize(resize_and_center_crop(load_rgb(img), image_size, resize_size), mean, std)


def tta_batch(x: np.ndarray, views: int) -> np.ndarray:
    """Stack flipped copies of a (3, H, W) array into a (views, 3, H, W) batch."""
    candidates = (x, x[:, :, ::-1], x[:, ::-1, :], x[:, ::-1, ::-1])
    return np.ascontiguousarray(np.stack(candidates[: max(1, min(views, 4))]))
