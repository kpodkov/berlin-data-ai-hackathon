"""Simple in-memory TTL cache for Snowflake query results."""

import time
from typing import Any

_store: dict[str, tuple[float, Any]] = {}

TTL_SECONDS = 60


def cache_get(key: str) -> Any | None:
    entry = _store.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.monotonic() > expires_at:
        del _store[key]
        return None
    return value


def cache_set(key: str, value: Any, ttl: int = TTL_SECONDS) -> None:
    _store[key] = (time.monotonic() + ttl, value)
