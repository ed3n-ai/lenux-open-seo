from __future__ import annotations

import os
from dataclasses import dataclass


def _split_csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip().rstrip("/") for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    api_key: str
    port: int
    allowed_sites: tuple[str, ...]
    service_name: str = "openseo-wordpress-api"
    version: str = "0.1.0"


def get_settings() -> Settings:
    api_key = os.getenv("OPENSEO_WP_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENSEO_WP_API_KEY is required")

    port = int(os.getenv("OPENSEO_WP_PORT", "8010"))
    allowed_sites = _split_csv(os.getenv("OPENSEO_WP_ALLOWED_SITES", ""))

    return Settings(
        api_key=api_key,
        port=port,
        allowed_sites=allowed_sites,
    )
