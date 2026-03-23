# Snowflake Data Pipeline Patterns

> Ingestion, schema design, and incremental loading patterns for Snowflake.
> Sources: Snowflake Documentation (2026), project ingestion guide, pipeline implementation plan.
> Use when building data pipelines that load external data into Snowflake.

---

## Ingestion Methods

| Method | Best For | Scriptable | Throughput |
|---|---|---|---|
| **Snowsight UI** | One-time ad hoc loads (<50MB) | No | Low |
| **PUT + COPY INTO** | Repeatable batch loads, CI scripts | Yes | High |
| **INFER_SCHEMA** | Unknown/changing schemas | Yes | Medium |
| **write_pandas** | Python-first workflows | Yes | Medium |
| **Snowpark save_as_table** | DataFrame transforms during load | Yes | Medium |
| **Snowpipe** | Continuous cloud-event-triggered loads | Yes (DDL) | High |

### PUT + COPY INTO (Primary Pattern)

```sql
-- 1. Stage the file
PUT file:///path/to/data.csv @my_db.raw.%my_table AUTO_COMPRESS=TRUE;

-- 2. Load into table
COPY INTO my_db.raw.my_table
  FROM @my_db.raw.%my_table
  FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1 FIELD_OPTIONALLY_ENCLOSED_BY='"')
  ON_ERROR = 'CONTINUE'
  PURGE = TRUE;
```

### Python write_pandas (Recommended for Python Pipelines)

```python
from snowflake.connector.pandas_tools import write_pandas
import snowflake.connector

conn = snowflake.connector.connect(
    account="your_account",
    user="your_user",
    password="your_password",
    database="MY_DB",
    schema="RAW",
    warehouse="MY_WH",
)

# Internally does PUT + COPY INTO in one call
write_pandas(conn, df, "MY_TABLE", auto_create_table=True)
conn.close()
```

### Schema Auto-Detection (INFER_SCHEMA)

```sql
CREATE OR REPLACE STAGE my_stage FILE_FORMAT = (TYPE=CSV PARSE_HEADER=TRUE);
PUT file:///path/to/data.csv @my_stage;

-- Auto-detect and create table
CREATE TABLE raw.my_table
  USING TEMPLATE (
    SELECT ARRAY_AGG(OBJECT_CONSTRUCT(*))
    FROM TABLE(INFER_SCHEMA(
      LOCATION => '@my_stage/data.csv',
      FILE_FORMAT => 'my_stage'
    ))
  );

-- Load with column matching
COPY INTO raw.my_table
  FROM @my_stage/data.csv
  FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1)
  MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE;
```

---

## Schema Design for Time Series

### Two-Table Pattern (Metadata + Observations)

```sql
-- Series metadata (one row per series)
CREATE TABLE raw.series_metadata (
    source        VARCHAR NOT NULL,       -- 'fred', 'ecb', 'eurostat', etc.
    series_id     VARCHAR NOT NULL,       -- e.g. 'GDPC1', 'EXR.D.USD.EUR.SP00.A'
    title         VARCHAR,
    units         VARCHAR,
    frequency     VARCHAR,                -- 'Daily', 'Monthly', 'Quarterly', 'Annual'
    seasonal_adj  VARCHAR,
    obs_start     DATE,
    obs_end       DATE,
    last_updated  TIMESTAMP_NTZ,
    fetched_at    TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (source, series_id)
);

-- Observations (one row per data point)
CREATE TABLE raw.observations (
    source         VARCHAR NOT NULL,
    series_id      VARCHAR NOT NULL,
    obs_date       DATE NOT NULL,
    value          NUMBER(38,8),          -- fixed-precision, not FLOAT
    realtime_start DATE,                  -- for vintage/revision tracking
    realtime_end   DATE,
    loaded_at      TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (source, series_id, obs_date)
);

-- Cluster on the primary access pattern
ALTER TABLE raw.observations CLUSTER BY (source, series_id, obs_date);
```

**Key decisions:**
- Use `NUMBER(38,8)` not `FLOAT` for economic values -- avoids floating-point rounding
- Composite primary key `(source, series_id, obs_date)` enables multi-source pipelines
- `realtime_start`/`realtime_end` columns support vintage data tracking (ALFRED, ECB revisions)
- Cluster on `(source, series_id, obs_date)` for time-range queries

---

## Incremental Loading with MERGE

The recommended pattern for idempotent upserts. Safe to re-run without duplicating data.

### Metadata MERGE

```sql
MERGE INTO raw.series_metadata tgt
USING (SELECT * FROM staging.series_metadata_load) src
  ON tgt.source = src.source AND tgt.series_id = src.series_id
WHEN MATCHED THEN UPDATE SET
    title = src.title,
    units = src.units,
    frequency = src.frequency,
    seasonal_adj = src.seasonal_adj,
    obs_start = src.obs_start,
    obs_end = src.obs_end,
    last_updated = src.last_updated,
    fetched_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
    source, series_id, title, units, frequency,
    seasonal_adj, obs_start, obs_end, last_updated, fetched_at
) VALUES (
    src.source, src.series_id, src.title, src.units, src.frequency,
    src.seasonal_adj, src.obs_start, src.obs_end, src.last_updated,
    CURRENT_TIMESTAMP()
);
```

### Observations MERGE

```sql
MERGE INTO raw.observations tgt
USING (SELECT * FROM staging.observations_load) src
  ON tgt.source = src.source
     AND tgt.series_id = src.series_id
     AND tgt.obs_date = src.obs_date
WHEN MATCHED AND tgt.value != src.value THEN UPDATE SET
    value = src.value,
    loaded_at = CURRENT_TIMESTAMP()
WHEN NOT MATCHED THEN INSERT (
    source, series_id, obs_date, value, realtime_start, realtime_end, loaded_at
) VALUES (
    src.source, src.series_id, src.obs_date, src.value,
    src.realtime_start, src.realtime_end, CURRENT_TIMESTAMP()
);
```

### Incremental State Tracking

Query the target table to determine the last loaded date per series:

```sql
SELECT series_id, MAX(obs_date) AS last_obs_date
FROM raw.observations
WHERE source = 'fred'
GROUP BY series_id;
```

Pass `last_obs_date` as `observation_start` to the source API to fetch only new data.

---

## Adapter Pattern for Multi-Source Pipelines

When ingesting from multiple sources (FRED, ECB, Eurostat, etc.), use an adapter pattern:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime
import pandas as pd

@dataclass(frozen=True)
class SeriesMetadata:
    source: str
    series_id: str
    title: str | None = None
    units: str | None = None
    frequency: str | None = None
    seasonal_adj: str | None = None

@dataclass(frozen=True)
class FetchResult:
    metadata: SeriesMetadata
    observations: pd.DataFrame  # columns: obs_date, value

class BaseAdapter(ABC):
    @abstractmethod
    def fetch(self, series_id: str, start: date | None = None) -> FetchResult:
        """Fetch observations for a single series."""
        ...

    @abstractmethod
    def fetch_metadata(self, series_id: str) -> SeriesMetadata:
        """Fetch metadata for a single series."""
        ...
```

Each source implements `BaseAdapter`. The pipeline orchestrator iterates over configured series, calls the appropriate adapter, and passes `FetchResult` to the `SnowflakeWriter`.

### SnowflakeWriter Pattern

```python
class SnowflakeWriter:
    def __init__(self, conn):
        self.conn = conn

    def ensure_tables(self):
        """Create metadata + observations tables if not exist."""
        ...

    def write(self, result: FetchResult):
        """Write FetchResult using write_pandas + MERGE."""
        # 1. write_pandas to a temp staging table
        # 2. MERGE from staging into target
        # 3. Drop staging table
        ...

    def get_last_date(self, source: str, series_id: str) -> date | None:
        """Query MAX(obs_date) for incremental loading."""
        ...
```

---

## CSV Loading Best Practices

| Practice | Why |
|---|---|
| Split large files into 100-250MB chunks | Snowflake loads files in parallel |
| GZIP before staging | Saves storage/transfer; Snowflake decompresses automatically |
| Use a dedicated warehouse sized for the load | Scale up for load, scale back for queries |
| Validate with `VALIDATION_MODE = 'RETURN_ERRORS'` | Dry-run before committing |
| Use `NUMBER(38,8)` for financial/economic values | Avoid floating-point rounding |
| Cluster on date columns | Improves time-range query performance |

---

## Snow CLI Execution

```bash
# Basic query
snow sql -q "SELECT COUNT(*) FROM MY_DB.RAW.OBSERVATIONS" -c my_conn

# Multi-statement
snow sql -q "USE WAREHOUSE MY_WH; SELECT * FROM MY_DB.RAW.OBSERVATIONS LIMIT 10" -c my_conn

# JSON output for semi-structured data
snow sql -q "SELECT * FROM MY_TABLE LIMIT 5" -c my_conn --format json

# From file
snow sql -f my_query.sql -c my_conn
```

Connection config lives in `~/.snowflake/connections.toml`.

---

## Cross-References

- See `rules/fred-ingestion.md` for FRED-specific API patterns and Python clients
- See `rules/sql-conventions.md` for SQL style and dbt conventions
- See `rules/pipeline-workflows.md` for multi-agent pipeline orchestration
