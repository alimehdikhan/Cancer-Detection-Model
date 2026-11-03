"""Long-lived objects shared by all requests in one worker process."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

from .cache import ResultCache
from .config import Settings
from .predictor import Predictor

log = logging.getLogger("app.services")


@dataclass
class Services:
    settings: Settings
    predictor: Predictor | None
    cache: ResultCache
    inference_slots: asyncio.Semaphore
    model_info: dict | None

    @classmethod
    def start(cls, settings: Settings) -> Services:
        predictor = load_predictor(settings)
        cache = ResultCache(settings.cache_max_items, settings.cache_ttl_seconds, settings.redis_url or None)
        log.info("cache ready", extra={"fields": {"backend": cache.backend}})
        return cls(
            settings=settings,
            predictor=predictor,
            cache=cache,
            inference_slots=asyncio.Semaphore(max(1, settings.max_concurrent_inferences)),
            model_info=predictor.info() if predictor else None,
        )

    async def stop(self) -> None:
        await self.cache.close()


def load_predictor(settings: Settings) -> Predictor | None:
    model_dir = settings.model_dir
    if not (model_dir / "model.onnx").exists() or not (model_dir / "model.json").exists():
        log.warning(
            "no model found; /predict will return 503",
            extra={"fields": {"model_dir": str(model_dir.resolve())}},
        )
        return None
    predictor = Predictor(model_dir, settings.tta_views, settings.resolved_ort_threads)
    predictor.warmup()
    if predictor.is_dev:
        log.warning("serving the UNTRAINED development model; predictions are meaningless")
    return predictor
