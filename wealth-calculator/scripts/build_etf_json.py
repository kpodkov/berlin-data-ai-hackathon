#!/usr/bin/env python3
"""
Extract ETF market data from Snowflake and write static JSON files
for the wealth calculator web app.

Usage: python3 build_etf_json.py

Outputs:
  wealth-calculator/public/data/etf_prices.json
  wealth-calculator/public/data/etf_metadata.json
"""

import json
import subprocess
import sys
from pathlib import Path

CONN = "hackathon"
WAREHOUSE = "WH_TEAM_3_XS"
OUT_DIR = Path(__file__).parent.parent / "public" / "data"

PRICES_SQL = (
    "USE WAREHOUSE {wh}; "
    "SELECT p.SERIES_ID AS ticker, p.OBS_DATE AS obs_date, p.VALUE AS close "
    "FROM DB_TEAM_3.RAW.MARKET_PRICES p "
    "INNER JOIN ("
    "  SELECT SERIES_ID, YEAR(OBS_DATE) AS yr, MONTH(OBS_DATE) AS mo, "
    "         MAX(OBS_DATE) AS last_trading_day "
    "  FROM DB_TEAM_3.RAW.MARKET_PRICES "
    "  GROUP BY SERIES_ID, YEAR(OBS_DATE), MONTH(OBS_DATE)"
    ") m "
    "ON p.SERIES_ID = m.SERIES_ID AND p.OBS_DATE = m.last_trading_day "
    "ORDER BY p.SERIES_ID, p.OBS_DATE"
).format(wh=WAREHOUSE)

METADATA_SQL = (
    "USE WAREHOUSE {wh}; "
    "SELECT SERIES_ID AS ticker, TITLE AS title, UNITS AS units, "
    "       FREQUENCY AS frequency, SOURCE AS source "
    "FROM DB_TEAM_3.RAW.MARKET_METADATA "
    "ORDER BY SERIES_ID"
).format(wh=WAREHOUSE)


def run_query(sql: str) -> list[dict]:
    """Run a snow sql query and return parsed JSON rows."""
    result = subprocess.run(
        ["snow", "sql", "-q", sql, "-c", CONN, "--format", "json"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR running query:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)

    # snow sql --format json wraps results in an outer array (one entry per statement)
    outer = json.loads(result.stdout)
    # Last element contains our SELECT results (first is USE WAREHOUSE status)
    rows = outer[-1]
    return rows


def build_prices_json(rows: list[dict]) -> dict:
    """Transform flat rows into {ticker: [{date, close}, ...]} structure."""
    prices: dict[str, list] = {}
    for row in rows:
        ticker = row["TICKER"]
        obs_date = row["OBS_DATE"]
        close_raw = row["CLOSE"]
        # Convert to float, round to 4 decimal places
        close = round(float(close_raw), 4)
        if ticker not in prices:
            prices[ticker] = []
        prices[ticker].append({"date": obs_date, "close": close})
    return prices


def build_metadata_json(rows: list[dict]) -> dict:
    """Transform flat rows into {ticker: {title, units, frequency, source}}."""
    metadata: dict[str, dict] = {}
    for row in rows:
        ticker = row["TICKER"]
        metadata[ticker] = {
            "title": row["TITLE"],
            "units": row["UNITS"],
            "frequency": row["FREQUENCY"],
            "source": row["SOURCE"],
        }
    return metadata


def validate(prices: dict, metadata: dict) -> None:
    required = {"SPY", "QQQ", "AGG"}
    missing = required - set(prices.keys())
    if missing:
        print(f"VALIDATION FAILED: missing tickers {missing}", file=sys.stderr)
        sys.exit(1)
    for ticker in required:
        count = len(prices[ticker])
        if count < 20 * 12:  # 20 years * 12 months
            print(
                f"VALIDATION FAILED: {ticker} has only {count} monthly rows (expected 240+)",
                file=sys.stderr,
            )
            sys.exit(1)
    print(f"Validation passed. Tickers: {sorted(prices.keys())}")
    for ticker in required:
        rows = prices[ticker]
        print(f"  {ticker}: {len(rows)} months, {rows[0]['date']} – {rows[-1]['date']}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching monthly prices...")
    price_rows = run_query(PRICES_SQL)
    print(f"  {len(price_rows)} rows received")

    print("Fetching metadata...")
    meta_rows = run_query(METADATA_SQL)
    print(f"  {len(meta_rows)} rows received")

    prices = build_prices_json(price_rows)
    metadata = build_metadata_json(meta_rows)

    validate(prices, metadata)

    prices_path = OUT_DIR / "etf_prices.json"
    metadata_path = OUT_DIR / "etf_metadata.json"

    prices_path.write_text(json.dumps(prices, indent=2))
    metadata_path.write_text(json.dumps(metadata, indent=2))

    print(f"Written: {prices_path}")
    print(f"Written: {metadata_path}")

    # Print file sizes
    print(f"  etf_prices.json:   {prices_path.stat().st_size / 1024:.1f} KB")
    print(f"  etf_metadata.json: {metadata_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
