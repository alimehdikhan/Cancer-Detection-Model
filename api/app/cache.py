"""Two-tier result cache: in-process TTL LRU, then Redis when configured.

The cache is an optimisation only. Redis being slow or down never fails a request.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable

from cachetools import TTLCache
from redis.asyncio import Redis
from redis.exceptions import RedisError

log = logging.getLogger("app.cache")


class ResultCache:
    def __init__(self, max_items: int, ttl_seconds: int, redis_url: str | None = None):
        self._memory: TTLCache[str, dict] = TTLCache(maxsize=max_items, ttl=ttl_seconds)
        self._ttl = ttl_seconds
        self._redis: Redis | None = (
            Redis.from_url(redis_url, socket_timeout=0.5, socket_connect_timeout=0.5) if redis_url else None
        )
        self._inflight: dict[str, asyncio.Future[dict]] = {}

    @property
    def backend(self) -> str:
        return "memory+redis" if self._redis is not None else "memory"

    async def get(self, key: str) -> dict | None:
        value = self._memory.get(key)
        if value is not None or self._redis is None:
            return value
        try:
            raw = await self._redis.get(key)
        except (RedisError, OSError) as exc:
            log.warning("redis get failed", extra={"fields": {"error": str(exc)}})
            return None
        if raw is None:
            return None
        value = json.loads(raw)
        self._memory[key] = value
        return value

    async def set(self, key: str, value: dict) -> None:
        self._memory[key] = value
        if self._redis is None:
            return
        try:
            await self._redis.set(key, json.dumps(value), ex=self._ttl)
        except (RedisError, OSError) as exc:
            log.warning("redis set failed", extra={"fields": {"error": str(exc)}})

    async def get_or_compute(self, key: str, compute: Callable[[], Awaitable[dict]]) -> tuple[dict, bool]:
        """Return (value, cached). Concurrent misses for the same key share one computation."""
        value = await self.get(key)
        if value is not None:
            return value, True

        pending = self._inflight.get(key)
        if pending is not None:
            return await asyncio.shield(pending), True

        future: asyncio.Future[dict] = asyncio.get_running_loop().create_future()
        self._inflight[key] = future
        try:
            value = await compute()
        except asyncio.CancelledError:
            future.cancel()
            raise
        except Exception as exc:
            future.set_exception(exc)
            future.exception()  # mark retrieved so asyncio does not warn when nobody was waiting
            raise
        else:
            await self.set(key, value)
            future.set_result(value)
            return value, False
        finally:
            self._inflight.pop(key, None)

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()
