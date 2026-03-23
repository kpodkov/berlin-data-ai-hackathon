"""Load all data sources into Snowflake: FRED, Market, World Bank."""

import subprocess
import sys
from pathlib import Path

CONNECTION = "hackathon"
DATABASE = "DB_TEAM_3"
SCHEMA = "RAW"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

SOURCES = [
    {
        "name": "FRED Observations",
        "table": "FRED_OBSERVATIONS",
        "csv": DATA_DIR / "fred" / "fred_sample.csv",
        "columns": "series_id VARCHAR NOT NULL, obs_date DATE NOT NULL, value NUMBER(38,8)",
    },
    {
        "name": "FRED Metadata",
        "table": "FRED_SERIES_METADATA",
        "csv": DATA_DIR / "fred" / "fred_metadata.csv",
        "columns": "series_id VARCHAR NOT NULL, title VARCHAR, units VARCHAR, frequency VARCHAR, seasonal_adjustment VARCHAR, last_updated VARCHAR, category VARCHAR",
    },
    {
        "name": "Market Prices",
        "table": "MARKET_PRICES",
        "csv": DATA_DIR / "market" / "market_prices.csv",
        "columns": "series_id VARCHAR NOT NULL, obs_date DATE NOT NULL, value NUMBER(38,8)",
    },
    {
        "name": "Market Metadata",
        "table": "MARKET_METADATA",
        "csv": DATA_DIR / "market" / "market_metadata.csv",
        "columns": "series_id VARCHAR NOT NULL, title VARCHAR, units VARCHAR, frequency VARCHAR, source VARCHAR",
    },
    {
        "name": "World Bank Indicators",
        "table": "WORLDBANK_INDICATORS",
        "csv": DATA_DIR / "worldbank" / "worldbank_indicators.csv",
        "columns": "series_id VARCHAR NOT NULL, obs_date DATE NOT NULL, value NUMBER(38,8)",
    },
    {
        "name": "World Bank Metadata",
        "table": "WORLDBANK_METADATA",
        "csv": DATA_DIR / "worldbank" / "worldbank_metadata.csv",
        "columns": "series_id VARCHAR NOT NULL, title VARCHAR, units VARCHAR, frequency VARCHAR, source VARCHAR",
    },
]


def snow_sql(query: str) -> str:
    result = subprocess.run(
        ["snow", "sql", "-q", query, "-c", CONNECTION],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}", file=sys.stderr)
        return ""
    print(result.stdout)
    return result.stdout


def load_source(source: dict) -> bool:
    name = source["name"]
    table = source["table"]
    csv_path = source["csv"]
    columns = source["columns"]
    stage = f"{table}_STAGE"

    if not csv_path.exists():
        print(f"  SKIPPED {name}: {csv_path.name} not found (run fetch script first)")
        return False

    print(f"\n{'='*60}")
    print(f"Loading {name} → {DATABASE}.{SCHEMA}.{table}")
    print(f"{'='*60}\n")

    # Create table
    snow_sql(f"""
        USE DATABASE {DATABASE};
        USE WAREHOUSE WH_TEAM_3_XS;
        CREATE SCHEMA IF NOT EXISTS {SCHEMA};
        CREATE OR REPLACE TABLE {SCHEMA}.{table} ({columns})
    """)

    # Create stage
    snow_sql(f"""
        USE DATABASE {DATABASE};
        CREATE OR REPLACE STAGE {SCHEMA}.{stage}
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
    """)

    # PUT file
    snow_sql(f"""
        USE DATABASE {DATABASE};
        PUT file://{csv_path} @{SCHEMA}.{stage} AUTO_COMPRESS=TRUE
    """)

    # COPY INTO
    snow_sql(f"""
        USE DATABASE {DATABASE};
        COPY INTO {SCHEMA}.{table}
            FROM @{SCHEMA}.{stage}
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
            ON_ERROR='CONTINUE' PURGE=TRUE
    """)

    return True


def verify():
    print(f"\n{'='*60}")
    print("VERIFICATION")
    print(f"{'='*60}\n")

    snow_sql(f"""
        USE DATABASE {DATABASE};
        SELECT 'FRED' AS source, COUNT(*) AS row_count, COUNT(DISTINCT series_id) AS series_count FROM {SCHEMA}.FRED_OBSERVATIONS
        UNION ALL
        SELECT 'MARKET', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.MARKET_PRICES
        UNION ALL
        SELECT 'WORLDBANK', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.WORLDBANK_INDICATORS
        ORDER BY source
    """)


def main():
    loaded = []
    skipped = []

    for source in SOURCES:
        if load_source(source):
            loaded.append(source["name"])
        else:
            skipped.append(source["name"])

    if loaded:
        verify()

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Loaded:  {', '.join(loaded) if loaded else 'none'}")
    if skipped:
        print(f"Skipped: {', '.join(skipped)}")
    print(f"\nTables in {DATABASE}.{SCHEMA}:")
    for s in SOURCES:
        if s["name"] in loaded:
            print(f"  ✓ {s['table']}")
        else:
            print(f"  ✗ {s['table']} (missing CSV)")


if __name__ == "__main__":
    main()
