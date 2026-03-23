"""Fetch ECB Statistical Data Warehouse series and save as CSV.

Covers: EUR exchange rates, key ECB interest rates, HICP inflation by country,
and government bond yields.

Uses the ECB SDMX REST API with CSV format.
Docs: https://data.ecb.europa.eu/help/api/data
"""

import io
import time
from pathlib import Path

import pandas as pd
import requests

ECB_BASE = "https://data-api.ecb.europa.eu/service/data"

# Each entry: (dataset, key, series_id_template, title_template, category)
# series_id_template and title_template use {dim} placeholder replaced per row.
DATASETS = [
    # ── Exchange rates (monthly avg) ───────────────────────────────────
    {
        "dataset": "EXR",
        "key": "M.USD+GBP+JPY+CHF+SEK+NOK+DKK+PLN+CZK+AUD+CAD+CNY+KRW+BRL+INR.EUR.SP00.A",
        "dim_col": "CURRENCY",
        "series_prefix": "ECB_EXR",
        "title_template": "EUR/{dim} Exchange Rate (monthly avg)",
        "category": "exchange_rates",
    },
    # ── Key ECB interest rates (business-day frequency) ──────────────
    {
        "dataset": "FM",
        "key": "B.U2.EUR.4F.KR.MRR_FR+DFR+MLF_FR.LEV",
        "dim_col": "PROVIDER_FM_ID",
        "series_prefix": "ECB_RATE",
        "title_template": "ECB {dim}",
        "category": "interest_rates",
        "title_map": {
            "MRR_FR": "Main Refinancing Rate",
            "DFR": "Deposit Facility Rate",
            "MLF_FR": "Marginal Lending Facility Rate",
        },
    },
    # ── HICP inflation (annual rate of change) ─────────────────────────
    {
        "dataset": "ICP",
        "key": "M.U2+DE+FR+IT+ES+NL+AT+BE+IE+PT+GR+FI.N.000000.4.ANR",
        "dim_col": "REF_AREA",
        "series_prefix": "ECB_HICP",
        "title_template": "HICP Inflation {dim} (YoY %)",
        "category": "inflation",
    },
    # ── Government bond yields 10Y ─────────────────────────────────────
    {
        "dataset": "FM",
        "key": "M.U2+DE+FR+IT+ES+NL+AT+BE+IE+PT+GR+FI.EUR.4F.BB.U2_10Y.YLD",
        "dim_col": "REF_AREA",
        "series_prefix": "ECB_GBY10Y",
        "title_template": "10Y Govt Bond Yield {dim}",
        "category": "bond_yields",
    },
]

COUNTRY_NAMES = {
    "U2": "Euro Area", "DE": "Germany", "FR": "France", "IT": "Italy",
    "ES": "Spain", "NL": "Netherlands", "AT": "Austria", "BE": "Belgium",
    "IE": "Ireland", "PT": "Portugal", "GR": "Greece", "FI": "Finland",
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "ecb"


def fetch_dataset(dataset_cfg: dict) -> tuple[pd.DataFrame, list[dict]]:
    """Fetch one ECB dataset, return (observations_df, metadata_rows)."""
    dataset = dataset_cfg["dataset"]
    key = dataset_cfg["key"]
    dim_col = dataset_cfg["dim_col"]
    prefix = dataset_cfg["series_prefix"]
    category = dataset_cfg["category"]
    title_map = dataset_cfg.get("title_map", {})

    url = f"{ECB_BASE}/{dataset}/{key}"
    params = {"startPeriod": "2000-01", "format": "csvdata"}

    print(f"  GET {dataset}/{key[:60]}...")
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()

    df = pd.read_csv(io.StringIO(resp.text))

    if "OBS_VALUE" not in df.columns or "TIME_PERIOD" not in df.columns:
        print(f"  WARNING: unexpected columns: {list(df.columns)}")
        return pd.DataFrame(), []

    obs_frames = []
    meta_rows = []

    for dim_val, group in df.groupby(dim_col):
        series_id = f"{prefix}_{dim_val}"
        sub = group[["TIME_PERIOD", "OBS_VALUE"]].copy()
        sub.columns = ["obs_date", "value"]
        # Parse period: monthly "2024-01" → first of month
        sub["obs_date"] = pd.to_datetime(sub["obs_date"], errors="coerce")
        sub = sub.dropna(subset=["obs_date"])
        sub["value"] = pd.to_numeric(sub["value"], errors="coerce")
        sub["series_id"] = series_id
        obs_frames.append(sub[["series_id", "obs_date", "value"]])

        display_name = title_map.get(dim_val, COUNTRY_NAMES.get(dim_val, dim_val))
        title = dataset_cfg["title_template"].replace("{dim}", display_name)
        meta_rows.append({
            "series_id": series_id,
            "title": title,
            "units": "%" if category in ("inflation", "interest_rates", "bond_yields") else "Rate",
            "frequency": "Monthly",
            "source": "ECB",
            "category": category,
        })

    if obs_frames:
        return pd.concat(obs_frames, ignore_index=True), meta_rows
    return pd.DataFrame(), []


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_obs = []
    all_meta = []
    failed = []

    for cfg in DATASETS:
        label = f"{cfg['dataset']}/{cfg['series_prefix']}"
        print(f"\nFetching {label} [{cfg['category']}]")
        try:
            obs, meta = fetch_dataset(cfg)
            if not obs.empty:
                all_obs.append(obs)
                all_meta.extend(meta)
                print(f"  Got {len(obs)} observations, {len(meta)} series")
            else:
                print(f"  No data returned")
                failed.append(label)
        except Exception as e:
            print(f"  FAILED: {e}")
            failed.append(label)
        time.sleep(1)

    if not all_obs:
        print("\nNo ECB data fetched!")
        return

    combined = pd.concat(all_obs, ignore_index=True)
    csv_path = OUTPUT_DIR / "ecb_observations.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for sid in combined["series_id"].unique():
        n = len(combined[combined["series_id"] == sid])
        print(f"  {sid}: {n} observations")

    meta_df = pd.DataFrame(all_meta)
    meta_path = OUTPUT_DIR / "ecb_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} series metadata to {meta_path}")

    if failed:
        print(f"\nFailed datasets ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
