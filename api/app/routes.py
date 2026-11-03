from __future__ import annotations

import hashlib
import time
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile
from fastapi.concurrency import run_in_threadpool

from .predictor import Predictor
from .preprocess import InvalidImage, UnsupportedImage
from .schemas import ErrorResponse, HealthResponse, ModelInfoResponse, PredictionResponse
from .services import Services

ALLOWED_CONTENT_TYPES = frozenset({"image/jpeg", "image/jpg", "image/png", "image/webp"})

router = APIRouter()


def _services(request: Request) -> Services:
    return request.app.state.services


def _require_model(services: Services) -> Predictor:
    if services.predictor is None:
        raise HTTPException(503, "No model is loaded. Train one or run api/scripts/make_dev_model.py.")
    return services.predictor


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    predictor = _services(request).predictor
    return HealthResponse(
        status="ok" if predictor else "degraded",
        model_loaded=predictor is not None,
        model_version=predictor.version if predictor else None,
    )


@router.get("/ready", responses={503: {"model": ErrorResponse}})
async def ready(request: Request) -> dict:
    _require_model(_services(request))
    return {"status": "ready"}


@router.get(
    "/model",
    response_model=ModelInfoResponse,
    responses={304: {"description": "Not modified"}, 503: {"model": ErrorResponse}},
)
async def model_info(request: Request, response: Response):
    services = _services(request)
    predictor = _require_model(services)
    etag = f'"{predictor.version}"'
    headers = {"ETag": etag, "Cache-Control": "public, max-age=300"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    response.headers.update(headers)
    return services.model_info


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={code: {"model": ErrorResponse} for code in (400, 413, 415, 503)},
)
async def predict(request: Request, response: Response, file: Annotated[UploadFile, File()]) -> dict:
    services = _services(request)
    predictor = _require_model(services)
    started = time.perf_counter()

    if (file.content_type or "").lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(415, "Upload a JPEG, PNG or WebP image.")
    limit = services.settings.max_upload_bytes
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"The image is larger than {services.settings.max_upload_mb:g} MB.")
    if not data:
        raise HTTPException(400, "The file is empty.")

    digest = hashlib.sha256(data).hexdigest()
    key = f"pred:{predictor.version}:tta{predictor.tta_views}:{digest}"

    async def compute() -> dict:
        async with services.inference_slots:
            return await run_in_threadpool(predictor.predict, data, digest[:16])

    try:
        result, cached = await services.cache.get_or_compute(key, compute)
    except UnsupportedImage as exc:
        raise HTTPException(415, str(exc)) from exc
    except InvalidImage as exc:
        raise HTTPException(400, str(exc)) from exc

    response.headers["X-Cache"] = "HIT" if cached else "MISS"
    elapsed_ms = (time.perf_counter() - started) * 1000
    return {**result, "cached": cached, "inference_ms": round(elapsed_ms, 1)}
