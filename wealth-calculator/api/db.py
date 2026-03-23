"""Snowflake connection singleton with simple query helper."""

import os
from typing import Any
import snowflake.connector
from snowflake.connector import DictCursor

_connection: snowflake.connector.SnowflakeConnection | None = None


def get_connection() -> snowflake.connector.SnowflakeConnection:
    """Return the singleton Snowflake connection, creating it if needed."""
    global _connection
    if _connection is None or _connection.is_closed():
        connect_params = dict(
            account=os.environ["SNOWFLAKE_ACCOUNT"],
            user=os.environ["SNOWFLAKE_USER"],
            password=os.environ["SNOWFLAKE_PASSWORD"],
            warehouse=os.environ.get("SNOWFLAKE_WAREHOUSE", "WH_TEAM_3_XS"),
            database=os.environ.get("SNOWFLAKE_DATABASE", "DB_TEAM_3"),
            schema=os.environ.get("SNOWFLAKE_SCHEMA", "MARTS"),
        )
        role = os.environ.get("SNOWFLAKE_ROLE")
        if role:
            connect_params["role"] = role
        _connection = snowflake.connector.connect(**connect_params)
    return _connection


def query(sql: str, params: dict[str, Any] | None = None) -> list[dict]:
    """
    Execute a SQL query and return rows as a list of dicts with lowercase keys.

    Reconnects automatically if the connection was dropped.
    Raises RuntimeError on query failure so callers can surface a clean 500.
    """
    conn = get_connection()
    try:
        with conn.cursor(DictCursor) as cur:
            cur.execute(sql, params or {})
            rows = cur.fetchall()
    except Exception as exc:
        # Force reconnect on next call
        global _connection
        _connection = None
        raise RuntimeError(f"Snowflake query failed: {exc}") from exc

    # Snowflake DictCursor returns UPPER_CASE keys — normalise to lower_case
    return [{k.lower(): v for k, v in row.items()} for row in rows]
