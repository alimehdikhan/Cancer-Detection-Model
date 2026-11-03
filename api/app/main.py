"""FastAPI application.

    uvicorn app.main:app --app-dir api --port 8000      # from the repository root
"""

from __future__ import annotations

import json
import logging
import re
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config import Settings
from .routes import router
from .services import Services

log = logging.getLogger("app")
_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            **getattr(record, "fields", {}),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    app_logger = logging.getLogger("app")
    app_logger.handlers[:] = [handler]
    app_logger.setLevel(level.upper())
    app_logger.propagate = False


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.services = Services.start(settings)
        yield
        await app.state.services.stop()

    app = FastAPI(
        title="Skin lesion classifier API",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_methods=["GET", "POST"],
            allow_headers=["*"],
            expose_headers=["X-Request-ID", "X-Cache", "Server-Timing"],
        )

    # Reject oversized uploads from the Content-Length header, before the body is parsed.
    body_limit = settings.max_upload_bytes + 64 * 1024  # multipart framing overhead

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if _REQUEST_ID.match(incoming) else uuid.uuid4().hex
        started = time.perf_counter()

        length = request.headers.get("content-length")
        if request.method == "POST" and length and length.isdigit() and int(length) > body_limit:
            response = JSONResponse(
                {"detail": f"The image is larger than {settings.max_upload_mb:g} MB."}, status_code=413
            )
        else:
            response = await call_next(request)

        duration_ms = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["Server-Timing"] = f"app;dur={duration_ms:.1f}"
        log.info(
            "request",
            extra={
                "fields": {
                    "id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "ms": round(duration_ms, 1),
                    "cache": response.headers.get("X-Cache"),
                }
            },
        )
        return response

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled error", extra={"fields": {"path": request.url.path}})
        return JSONResponse({"detail": "Internal server error."}, status_code=500)

    app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
