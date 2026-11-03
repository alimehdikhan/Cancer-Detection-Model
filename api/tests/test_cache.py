from __future__ import annotations

import asyncio

import pytest

from app.cache import ResultCache


def test_concurrent_misses_compute_once():
    async def scenario():
        cache = ResultCache(max_items=10, ttl_seconds=60)
        calls = 0

        async def compute():
            nonlocal calls
            calls += 1
            await asyncio.sleep(0.05)
            return {"value": 1}

        results = await asyncio.gather(*(cache.get_or_compute("key", compute) for _ in range(5)))
        return calls, results

    calls, results = asyncio.run(scenario())
    assert calls == 1
    assert all(value == {"value": 1} for value, _ in results)
    assert [cached for _, cached in results].count(False) == 1


def test_failures_reach_waiters_and_are_not_cached():
    async def scenario():
        cache = ResultCache(max_items=10, ttl_seconds=60)

        async def failing():
            await asyncio.sleep(0.01)
            raise ValueError("bad image")

        outcomes = await asyncio.gather(
            *(cache.get_or_compute("key", failing) for _ in range(3)), return_exceptions=True
        )
        assert all(isinstance(o, ValueError) for o in outcomes)
        assert await cache.get("key") is None

    asyncio.run(scenario())


def test_unreachable_redis_degrades_to_memory():
    async def scenario():
        cache = ResultCache(max_items=10, ttl_seconds=60, redis_url="redis://127.0.0.1:1/0")

        async def compute():
            return {"value": 2}

        assert await cache.get_or_compute("key", compute) == ({"value": 2}, False)
        assert await cache.get_or_compute("key", compute) == ({"value": 2}, True)
        await cache.close()

    asyncio.run(scenario())


@pytest.mark.parametrize("ttl", [60])
def test_memory_tier_respects_capacity(ttl):
    async def scenario():
        cache = ResultCache(max_items=2, ttl_seconds=ttl)
        for i in range(3):
            await cache.set(f"k{i}", {"i": i})
        return [await cache.get(f"k{i}") for i in range(3)]

    assert asyncio.run(scenario()) == [None, {"i": 1}, {"i": 2}]
