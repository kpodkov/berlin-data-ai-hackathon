#!/usr/bin/env python3
"""
Extract FRED data from Snowflake and write static JSON files for the wealth calculator.

Usage:
    python extract-fred.py

Outputs:
    ../public/data/fred_series.json    -- {series_id: [{date, value}, ...]}
    ../public/data/fred_metadata.json  -- {series_id: {title, units, ...}}
"""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR.parent / "public" / "data"

OBSERVATIONS_QUERY = """
USE WAREHOUSE WH_TEAM_3_XS;
SELECT
    o.SERIES_ID,
    TO_CHAR(o.OBS_DATE, 'YYYY-MM-DD') AS OBS_DATE,
    o.VALUE::FLOAT AS VALUE,
    m.TITLE,
    m.UNITS,
    m.FREQUENCY,
    m.SEASONAL_ADJUSTMENT,
    TO_CHAR(m.LAST_UPDATED) AS LAST_UPDATED,
    m.CATEGORY
FROM DB_TEAM_3.RAW.FRED_OBSERVATIONS o
JOIN DB_TEAM_3.RAW.FRED_SERIES_METADATA m
    ON o.SERIES_ID = m.SERIES_ID
WHERE o.SERIES_ID IS NOT NULL
  AND o.OBS_DATE IS NOT NULL
  AND o.VALUE IS NOT NULL
ORDER BY o.SERIES_ID, o.OBS_DATE
"""


def run_snow_query(query: str) -> list[dict]:
    """Run a Snowflake query via snow CLI and return rows as list of dicts."""
    result = subprocess.run(
        ["snow", "sql", "-q", query, "-c", "hackathon", "--format", "json"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR running query:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(
            f"ERROR parsing JSON output: {e}\nOutput was:\n{result.stdout[:500]}",
            file=sys.stderr,
        )
        sys.exit(1)

    # snow sql with multi-statement returns nested arrays: [[USE result], [actual data]]
    # Find the largest array of dicts — that's our data
    if isinstance(data, list) and data and isinstance(data[0], list):
        rows = max(data, key=len)
    else:
        rows = data

    return rows


def build_fred_series(rows: list[dict]) -> dict:
    """Build series observations keyed by series_id."""
    series: dict[str, list] = {}
    for row in rows:
        sid = row["SERIES_ID"]
        if sid not in series:
            series[sid] = []
        value = row["VALUE"]
        # Skip null values (already filtered in SQL but belt-and-suspenders)
        if value is None:
            continue
        series[sid].append({"date": row["OBS_DATE"], "value": value})
    return series


def build_fred_metadata(rows: list[dict]) -> dict:
    """Build metadata keyed by series_id (one entry per series)."""
    metadata: dict[str, dict] = {}
    for row in rows:
        sid = row["SERIES_ID"]
        if sid in metadata:
            continue  # already captured
        metadata[sid] = {
            "title": row["TITLE"],
            "units": row["UNITS"],
            "frequency": row["FREQUENCY"],
            "seasonalAdjustment": row["SEASONAL_ADJUSTMENT"],
            "lastUpdated": row["LAST_UPDATED"],
            "category": row["CATEGORY"],
        }
    return metadata


def validate(series: dict, metadata: dict) -> bool:
    """Validate output: all series present, no empty series."""
    ok = True
    series_ids = set(series.keys())
    meta_ids = set(metadata.keys())

    if series_ids != meta_ids:
        missing_in_series = meta_ids - series_ids
        missing_in_meta = series_ids - meta_ids
        if missing_in_series:
            print(
                f"WARNING: series in metadata but no observations: {missing_in_series}"
            )
        if missing_in_meta:
            print(
                f"WARNING: series with observations but no metadata: {missing_in_meta}"
            )
        ok = False

    empty = [sid for sid, obs in series.items() if not obs]
    if empty:
        print(f"WARNING: series with zero observations: {empty}")
        ok = False

    print(f"Series count: {len(series_ids)}")
    print(f"Total observations: {sum(len(v) for v in series.values())}")
    return ok


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Querying Snowflake...")
    rows = run_snow_query(OBSERVATIONS_QUERY)
    print(f"Fetched {len(rows)} rows from Snowflake")

    series = build_fred_series(rows)
    metadata = build_fred_metadata(rows)

    valid = validate(series, metadata)
    if not valid:
        print("Validation warnings above — continuing with available data")

    series_path = OUTPUT_DIR / "fred_series.json"
    metadata_path = OUTPUT_DIR / "fred_metadata.json"

    with open(series_path, "w") as f:
        json.dump(series, f, separators=(",", ":"))
    print(f"Written: {series_path}")

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Written: {metadata_path}")

    # Print a brief summary
    print("\nSeries summary:")
    for sid in sorted(series.keys()):
        obs = series[sid]
        if obs:
            print(
                f"  {sid}: {len(obs)} observations ({obs[0]['date']} – {obs[-1]['date']})"
            )
        else:
            print(f"  {sid}: 0 observations (WARNING)")


if __name__ == "__main__":
    main()
