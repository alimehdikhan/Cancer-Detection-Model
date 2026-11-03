from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Read from environment variables (case-insensitive) or a .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=())

    model_dir: Path = Path("models/current")
    redis_url: str | None = None
    cache_ttl_seconds: int = 7 * 24 * 3600
    cache_max_items: int = 4096
    max_upload_mb: float = 10.0
    tta_views: int | None = None  # None = use the value the model was calibrated with
    ort_threads: int = 0  # 0 = CPU cores / uvicorn workers
    max_concurrent_inferences: int = 2
    cors_origins: str = ""  # comma-separated; empty disables CORS
    log_level: str = "INFO"

    @property
    def max_upload_bytes(self) -> int:
        return int(self.max_upload_mb * 1024 * 1024)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_ort_threads(self) -> int:
        if self.ort_threads > 0:
            return self.ort_threads
        workers = max(1, int(os.environ.get("WEB_CONCURRENCY", "1")))
        return max(1, (os.cpu_count() or 1) // workers)
