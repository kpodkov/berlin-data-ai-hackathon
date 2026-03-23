"""Shared utilities for response shaping."""

import re
from typing import Any


def _to_camel(snake: str) -> str:
    """Convert snake_case or UPPER_CASE to camelCase."""
    parts = snake.lower().split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def camel_row(row: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of row with all keys converted to camelCase."""
    return {_to_camel(k): v for k, v in row.items()}


def camel_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [camel_row(r) for r in rows]
