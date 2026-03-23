"""Load all data sources into Snowflake RAW layer.

Naming convention:
    DB_TEAM_3.RAW.{SOURCE}_OBSERVATIONS  -- time series (series_id, obs_date, value)
    DB_TEAM_3.RAW.{SOURCE}_METADATA      -- series info (series_id, title, units, ...)

Sources: FRED, YAHOO, WORLDBANK, ECB, OECD
"""

import subprocess
import sys
from pathlib import Path

CONNECTION = "hackathon"
DATABASE = "DB_TEAM_3"
SCHEMA = "RAW"
WAREHOUSE = "WH_TEAM_3_XS"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# Standard column definitions shared across all sources
OBS_COLUMNS = "series_id VARCHAR NOT NULL, obs_date DATE NOT NULL, value NUMBER(38,8)"
META_COLUMNS = (
    "series_id VARCHAR NOT NULL, title VARCHAR, units VARCHAR, "
    "frequency VARCHAR, source VARCHAR, category VARCHAR"
)

SOURCES = [
    # ── FRED ───────────────────────────────────────────────────────────
    {
        "name": "FRED Observations",
        "table": "FRED_OBSERVATIONS",
        "csv": DATA_DIR / "fred" / "fred_observations.csv",
        "columns": OBS_COLUMNS,
        "comment": "FRED time series: macro, income, savings, debt, housing, CPI, rates, spreads, commodities, money supply, labor, wealth, EU macro, OECD CLIs.",
    },
    {
        "name": "FRED Metadata",
        "table": "FRED_METADATA",
        "csv": DATA_DIR / "fred" / "fred_metadata.csv",
        "columns": META_COLUMNS,
        "comment": "Metadata for FRED series in FRED_OBSERVATIONS.",
    },
    # ── Yahoo Finance ──────────────────────────────────────────────────
    {
        "name": "Yahoo Observations",
        "table": "YAHOO_OBSERVATIONS",
        "csv": DATA_DIR / "yahoo" / "yahoo_observations.csv",
        "columns": OBS_COLUMNS,
        "comment": "Yahoo Finance daily prices: US ETFs (broad, sector, factor, dividend, fixed income), EU country ETFs, EU indices, international, real assets, crypto.",
    },
    {
        "name": "Yahoo Metadata",
        "table": "YAHOO_METADATA",
        "csv": DATA_DIR / "yahoo" / "yahoo_metadata.csv",
        "columns": META_COLUMNS,
        "comment": "Metadata for tickers in YAHOO_OBSERVATIONS.",
    },
    # ── World Bank ─────────────────────────────────────────────────────
    {
        "name": "World Bank Observations",
        "table": "WORLDBANK_OBSERVATIONS",
        "csv": DATA_DIR / "worldbank" / "worldbank_observations.csv",
        "columns": OBS_COLUMNS,
        "comment": "World Bank indicators: income, inflation, employment, savings, debt, financial markets, inequality, demographics, trade. 31 countries, annual.",
    },
    {
        "name": "World Bank Metadata",
        "table": "WORLDBANK_METADATA",
        "csv": DATA_DIR / "worldbank" / "worldbank_metadata.csv",
        "columns": META_COLUMNS,
        "comment": "Metadata for World Bank indicator-country series.",
    },
    # ── ECB ─────────────────────────────────────────────────────────────
    {
        "name": "ECB Observations",
        "table": "ECB_OBSERVATIONS",
        "csv": DATA_DIR / "ecb" / "ecb_observations.csv",
        "columns": OBS_COLUMNS,
        "comment": "ECB Statistical Data Warehouse: EUR exchange rates, key interest rates, HICP inflation, government bond yields.",
    },
    {
        "name": "ECB Metadata",
        "table": "ECB_METADATA",
        "csv": DATA_DIR / "ecb" / "ecb_metadata.csv",
        "columns": META_COLUMNS,
        "comment": "Metadata for ECB series in ECB_OBSERVATIONS.",
    },
    # ── OECD ────────────────────────────────────────────────────────────
    {
        "name": "OECD Observations",
        "table": "OECD_OBSERVATIONS",
        "csv": DATA_DIR / "oecd" / "oecd_observations.csv",
        "columns": OBS_COLUMNS,
        "comment": "OECD indicators: house price indices, price-to-income, price-to-rent, long-term interest rates. 24 countries.",
    },
    {
        "name": "OECD Metadata",
        "table": "OECD_METADATA",
        "csv": DATA_DIR / "oecd" / "oecd_metadata.csv",
        "columns": META_COLUMNS,
        "comment": "Metadata for OECD series in OECD_OBSERVATIONS.",
    },
]


def snow_sql(query: str) -> str:
    """Execute a Snowflake SQL statement via snow CLI."""
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
    """Load a single CSV into Snowflake via PUT + COPY INTO."""
    name = source["name"]
    table = source["table"]
    csv_path = source["csv"]
    columns = source["columns"]
    comment = source.get("comment", "")
    stage = f"{table}_STAGE"

    if not csv_path.exists():
        print(f"  SKIPPED {name}: {csv_path.name} not found (run fetch script first)")
        return False

    print(f"\n{'='*60}")
    print(f"Loading {name} → {DATABASE}.{SCHEMA}.{table}")
    print(f"{'='*60}\n")

    # Create table with comment
    comment_sql = f" COMMENT = '{comment}'" if comment else ""
    snow_sql(f"""
        USE DATABASE {DATABASE};
        USE WAREHOUSE {WAREHOUSE};
        CREATE SCHEMA IF NOT EXISTS {SCHEMA};
        CREATE OR REPLACE TABLE {SCHEMA}.{table} ({columns}){comment_sql}
    """)

    # Create stage
    snow_sql(f"""
        USE DATABASE {DATABASE};
        CREATE OR REPLACE STAGE {SCHEMA}.{stage}
            FILE_FORMAT = (
                TYPE=CSV
                SKIP_HEADER=1
                FIELD_OPTIONALLY_ENCLOSED_BY='"'
                NULL_IF=('','.')
            )
    """)

    # PUT file
    snow_sql(f"""
        USE DATABASE {DATABASE};
        PUT file://{csv_path} @{SCHEMA}.{stage} AUTO_COMPRESS=TRUE OVERWRITE=TRUE
    """)

    # COPY INTO
    snow_sql(f"""
        USE DATABASE {DATABASE};
        COPY INTO {SCHEMA}.{table}
            FROM @{SCHEMA}.{stage}
            FILE_FORMAT = (
                TYPE=CSV
                SKIP_HEADER=1
                FIELD_OPTIONALLY_ENCLOSED_BY='"'
                NULL_IF=('','.')
            )
            ON_ERROR='CONTINUE' PURGE=TRUE
    """)

    return True


def verify():
    """Print row counts for all loaded tables."""
    print(f"\n{'='*60}")
    print("VERIFICATION")
    print(f"{'='*60}\n")

    snow_sql(f"""
        USE DATABASE {DATABASE};
        SELECT 'FRED' AS source, COUNT(*) AS rows, COUNT(DISTINCT series_id) AS series FROM {SCHEMA}.FRED_OBSERVATIONS
        UNION ALL SELECT 'YAHOO', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.YAHOO_OBSERVATIONS
        UNION ALL SELECT 'WORLDBANK', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.WORLDBANK_OBSERVATIONS
        UNION ALL SELECT 'ECB', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.ECB_OBSERVATIONS
        UNION ALL SELECT 'OECD', COUNT(*), COUNT(DISTINCT series_id) FROM {SCHEMA}.OECD_OBSERVATIONS
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
        status = "OK" if s["name"] in loaded else "MISSING CSV"
        print(f"  {'✓' if s['name'] in loaded else '✗'} {s['table']} ({status})")


if __name__ == "__main__":
    main()
