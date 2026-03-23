# FRED Data Ingestion

> API patterns, Python clients, and gotchas for Federal Reserve Economic Data (FRED).
> Source: FRED API documentation (https://fred.stlouisfed.org/docs/api/), project research.
> Use when building pipelines that ingest economic time series from FRED into Snowflake or any warehouse.

---

## API Overview

| Property | Value |
|---|---|
| Base URL | `https://api.stlouisfed.org/fred/` |
| Auth | API key (free, 32-char alphanumeric) |
| Rate limit | 120 requests / 60 seconds (0.5s sleep between calls) |
| Default response | JSON, up to 100,000 observations per request |
| Missing values | String `"."` -- not null, not NaN |

### Key Endpoints

| Endpoint | Returns |
|---|---|
| `fred/series/observations` | Time series data points |
| `fred/series` | Series metadata |
| `fred/series/search` | Full-text series search |
| `fred/series/updates` | Recently updated series |
| `fred/series/vintagedates` | Revision history dates (ALFRED) |
| `fred/release/dates` | Release calendar |

### Common Query Parameters

| Parameter | Values | Use |
|---|---|---|
| `series_id` | e.g. `GDPC1`, `UNRATE` | Required |
| `observation_start` | `YYYY-MM-DD` | Incremental loading |
| `observation_end` | `YYYY-MM-DD` | Date range filter |
| `units` | `lin` (raw), `pch` (% change), `pc1` (YoY %) | Set `lin` to avoid double-transform |
| `frequency` | `d`, `w`, `m`, `q`, `a` | Aggregation |
| `file_type` | `json` (default) | Response format |

---

## Python Client: fredapi (Recommended)

```bash
pip install fredapi
```

```python
import os
from fredapi import Fred

fred = Fred(api_key=os.environ["FRED_API_KEY"])

# Fetch series as pandas Series (DatetimeIndex)
gdp = fred.get_series("GDPC1")

# With date range (for incremental loading)
unrate = fred.get_series("UNRATE", observation_start="2024-01-01")

# Metadata
info = fred.get_series_info("GDPC1")
# Returns: title, units, frequency, seasonal_adjustment, last_updated, etc.

# Search
results = fred.search("unemployment rate")

# Vintage data (ALFRED -- point-in-time accuracy for backtesting)
vintage = fred.get_series("GDPC1",
                          realtime_start="2020-01-15",
                          realtime_end="2020-01-15")
```

### Client Comparison

| Library | Pandas | Full API | Vintage | Maintenance | Use When |
|---|---|---|---|---|---|
| `fredapi` | Yes | Good | Yes | Active | Default choice |
| `pandas-datareader` | Yes | Minimal | No | Intermittent | Legacy/simple |
| `requests` (raw) | Manual | Full | Full | N/A | Custom pipelines |
| `full_fred` | Partial | Full | Yes | Less active | Full coverage needed |

---

## Ingestion Patterns

### Bulk Load (Initial)

```python
import time
from fredapi import Fred
import pandas as pd

fred = Fred(api_key=os.environ["FRED_API_KEY"])
SERIES_IDS = ["GDPC1", "UNRATE", "CPIAUCSL", "FEDFUNDS", "DGS10"]

frames = {}
for sid in SERIES_IDS:
    frames[sid] = fred.get_series(sid)
    time.sleep(0.5)  # respect rate limit

df = pd.DataFrame(frames)
```

### Incremental Load (Scheduled)

```python
def incremental_load(fred, series_id: str, last_date: str | None) -> pd.DataFrame:
    """Fetch only new observations since last_date."""
    start = last_date if last_date else "1776-07-04"  # FRED's beginning of time
    series = fred.get_series(series_id, observation_start=start)
    if series.empty:
        return pd.DataFrame(columns=["obs_date", "value"])
    df = series.reset_index()
    df.columns = ["obs_date", "value"]
    df["series_id"] = series_id
    df["source"] = "fred"
    return df
```

Query `MAX(obs_date)` from Snowflake per series to get `last_date`. See `rules/snowflake-pipelines.md` for the MERGE upsert pattern.

### Release-Triggered Load

Poll `fred/series/updates` to detect newly released data:

```python
import requests

def get_recently_updated(api_key: str, limit: int = 100) -> list[str]:
    resp = requests.get(
        "https://api.stlouisfed.org/fred/series/updates",
        params={"api_key": api_key, "file_type": "json",
                "filter_value": "macro", "limit": limit},
    )
    resp.raise_for_status()
    return [s["id"] for s in resp.json()["seriess"]]
```

### FRED-MD Bulk Dataset

For large-scale academic macro datasets (~130 monthly series):

```python
FRED_MD_URL = "https://files.stlouisfed.org/files/htdocs/fred-md/monthly/current.csv"
df = pd.read_csv(FRED_MD_URL)
# Row 0 contains transformation codes (1-7), data starts row 1
transform_codes = df.iloc[0]
df = df.iloc[1:].reset_index(drop=True)
df["sasdate"] = pd.to_datetime(df["sasdate"])
```

---

## Gotchas

| Gotcha | Impact | Fix |
|---|---|---|
| Missing values = `"."` | Silent errors if not handled | `pd.to_numeric(df["value"], errors="coerce")` |
| Revisions (vintage data) | API returns latest vintage by default -- causes look-ahead bias in backtests | Use `realtime_start`/`realtime_end` for point-in-time data |
| SA vs NSA variants | Similar IDs, different adjustments (e.g. `UNRATE` vs `UNRATENSA`) | Confirm variant before building pipeline |
| `units` parameter | API can pre-transform data -- double-transform if you also transform downstream | Set `units=lin` (raw) and transform yourself |
| Date alignment | Monthly = 1st of month, quarterly = 1st of quarter | Use `pd.merge_asof()` or `resample()` for cross-frequency joins |
| API key in code | Security risk | Always use `os.environ["FRED_API_KEY"]` |
| Pagination | Default 100k limit covers most series; very long daily series may need `offset` | Check `count` field in response |

---

## Reference Series IDs

| Series ID | Title | Frequency |
|---|---|---|
| `GDPC1` | Real GDP | Quarterly |
| `UNRATE` | Unemployment Rate | Monthly |
| `CPIAUCSL` | CPI All Urban Consumers | Monthly |
| `FEDFUNDS` | Fed Funds Rate | Monthly |
| `DFF` | Fed Funds Rate (daily) | Daily |
| `GS10` / `DGS10` | 10-Year Treasury | Monthly / Daily |
| `T10Y2Y` | 10Y-2Y Treasury Spread | Daily |
| `PAYEMS` | Nonfarm Payrolls | Monthly |
| `INDPRO` | Industrial Production | Monthly |
| `SP500` | S&P 500 Index | Daily |
| `DEXUSEU` | USD/EUR Exchange Rate | Daily |
| `VIXCLS` | CBOE VIX | Daily |

---

## Refresh Frequency

| Series Frequency | Suggested Refresh |
|---|---|
| Daily (market data) | Daily, after 5 PM ET |
| Weekly | Weekly, Monday morning |
| Monthly | After BLS/BEA release dates |
| Quarterly | Quarterly |

Use `fred/series` metadata `last_updated` field to skip fetching unchanged series.

---

## Cross-References

- See `rules/snowflake-pipelines.md` for Snowflake-specific ingestion, MERGE upserts, and schema design
- See `rules/sql-conventions.md` for SQL style conventions
