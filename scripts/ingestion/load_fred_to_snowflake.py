"""Load FRED observations + metadata CSVs into Snowflake using PUT + COPY INTO."""

import subprocess
import sys
from pathlib import Path

CONNECTION = "hackathon"
DATABASE = "DB_TEAM_3"
SCHEMA = "RAW"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "fred"


def snow_sql(query: str) -> str:
    """Run a SQL statement via snow CLI and return output."""
    result = subprocess.run(
        ["snow", "sql", "-q", query, "-c", CONNECTION],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    print(result.stdout)
    return result.stdout


def load_observations():
    csv_path = DATA_DIR / "fred_sample.csv"
    table = "FRED_OBSERVATIONS"
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}\nRun fetch_fred_sample.py first.")

    print(f"=== Loading observations → {DATABASE}.{SCHEMA}.{table} ===\n")

    snow_sql(f"""
        USE DATABASE {DATABASE};
        USE WAREHOUSE WH_TEAM_3_XS;
        CREATE SCHEMA IF NOT EXISTS {SCHEMA};
        CREATE OR REPLACE TABLE {SCHEMA}.{table} (
            series_id   VARCHAR NOT NULL,
            obs_date    DATE NOT NULL,
            value       NUMBER(38,8)
        )
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        CREATE OR REPLACE STAGE {SCHEMA}.fred_obs_stage
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        PUT file://{csv_path} @{SCHEMA}.fred_obs_stage AUTO_COMPRESS=TRUE
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        COPY INTO {SCHEMA}.{table}
            FROM @{SCHEMA}.fred_obs_stage
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
            ON_ERROR='CONTINUE' PURGE=TRUE
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        SELECT series_id, COUNT(*) AS row_count, MIN(obs_date) AS earliest, MAX(obs_date) AS latest
        FROM {SCHEMA}.{table}
        GROUP BY series_id ORDER BY series_id
    """)


def load_metadata():
    csv_path = DATA_DIR / "fred_metadata.csv"
    table = "FRED_SERIES_METADATA"
    if not csv_path.exists():
        print("No metadata CSV found — skipping metadata load.")
        return

    print(f"\n=== Loading metadata → {DATABASE}.{SCHEMA}.{table} ===\n")

    snow_sql(f"""
        USE DATABASE {DATABASE};
        CREATE OR REPLACE TABLE {SCHEMA}.{table} (
            series_id             VARCHAR NOT NULL,
            title                 VARCHAR,
            units                 VARCHAR,
            frequency             VARCHAR,
            seasonal_adjustment   VARCHAR,
            last_updated          VARCHAR,
            category              VARCHAR
        )
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        CREATE OR REPLACE STAGE {SCHEMA}.fred_meta_stage
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        PUT file://{csv_path} @{SCHEMA}.fred_meta_stage AUTO_COMPRESS=TRUE
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        COPY INTO {SCHEMA}.{table}
            FROM @{SCHEMA}.fred_meta_stage
            FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"' NULL_IF=('','.'))
            ON_ERROR='CONTINUE' PURGE=TRUE
    """)

    snow_sql(f"""
        USE DATABASE {DATABASE};
        SELECT series_id, title, frequency FROM {SCHEMA}.{table} ORDER BY series_id
    """)


def main():
    load_observations()
    load_metadata()
    print("\nDone! Tables ready:")
    print(f"  {DATABASE}.{SCHEMA}.FRED_OBSERVATIONS")
    print(f"  {DATABASE}.{SCHEMA}.FRED_SERIES_METADATA")


if __name__ == "__main__":
    main()
