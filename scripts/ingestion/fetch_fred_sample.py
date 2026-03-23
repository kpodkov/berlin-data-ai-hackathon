"""Fetch a sample of FRED time series and save as CSV/Parquet."""

import os
import time
from pathlib import Path

import pandas as pd
from fredapi import Fred

SERIES = {
    "GDPC1": "Real GDP (quarterly)",
    "UNRATE": "Unemployment Rate (monthly)",
    "CPIAUCSL": "CPI All Urban (monthly)",
    "FEDFUNDS": "Fed Funds Rate (monthly)",
    "DGS10": "10-Year Treasury (daily)",
}

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "fred"


def main():
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set FRED_API_KEY environment variable. Get one at https://fred.stlouisfed.org/docs/api/api_key.html"
        )

    fred = Fred(api_key=api_key)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    for series_id, label in SERIES.items():
        print(f"Fetching {series_id} — {label}")
        s = fred.get_series(series_id)
        df = s.reset_index()
        df.columns = ["obs_date", "value"]
        df["series_id"] = series_id
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        frames.append(df)
        time.sleep(0.5)

    combined = pd.concat(frames, ignore_index=True)
    combined = combined[["series_id", "obs_date", "value"]]

    csv_path = OUTPUT_DIR / "fred_sample.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for sid in SERIES:
        n = len(combined[combined["series_id"] == sid])
        print(f"  {sid}: {n} observations")


if __name__ == "__main__":
    main()
