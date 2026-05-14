from __future__ import annotations

from fastapi import Header, HTTPException, status

from .config import get_settings


def require_api_key(x_openseo_api_key: str | None = Header(default=None)) -> None:
    settings = get_settings()

    if x_openseo_api_key == settings.api_key:
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key",
    )
