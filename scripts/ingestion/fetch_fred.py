"""Fetch a sample of FRED time series and save as CSV/Parquet."""

import os
import time
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fredapi import Fred

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

SERIES = {
    # Macro backdrop
    "GDPC1": "Real GDP (quarterly)",
    "UNRATE": "Unemployment Rate (monthly)",
    "CPIAUCSL": "CPI All Urban (monthly)",
    "FEDFUNDS": "Fed Funds Rate (monthly)",
    "DGS10": "10-Year Treasury Yield (daily)",
    # Income & wages
    "PI": "Personal Income (monthly)",
    "CES0500000003": "Avg Hourly Earnings - Private (monthly)",
    "MEHOINUSA672N": "Real Median Household Income (annual)",
    "A229RX0": "Real Personal Income Per Capita (monthly)",
    # Savings
    "PSAVERT": "Personal Savings Rate (monthly)",
    "SAVINGSL": "Personal Savings Level (monthly)",
    # Debt & borrowing costs
    "MORTGAGE30US": "30-Year Mortgage Rate (weekly)",
    "TERMCBCCALLNS": "Credit Card Interest Rate (quarterly)",
    "TOTALSL": "Total Consumer Credit (monthly)",
    "REVOLSL": "Revolving Consumer Credit (monthly)",
    "NONREVSL": "Non-Revolving Consumer Credit (monthly)",
    "TDSP": "Household Debt Service Ratio (quarterly)",
    # Housing
    "CSUSHPISA": "Case-Shiller Home Price Index (monthly)",
    "MSPUS": "Median Home Sale Price (quarterly)",
    "FIXHAI": "Housing Affordability Index (monthly)",
    "CUSR0000SEHA": "CPI Rent of Primary Residence (monthly)",
    "HOUST": "Housing Starts (monthly)",
    # Cost of living breakdown
    "CPIUFDSL": "CPI Food (monthly)",
    "CPIENGSL": "CPI Energy (monthly)",
    "CPIMEDSL": "CPI Medical Care (monthly)",
    "CUSR0000SAE1": "CPI Education (monthly)",
    "CUUR0000SAT1": "CPI Transportation (monthly)",
    # Stock market & wealth
    "SP500": "S&P 500 Index (daily)",
    "VIXCLS": "CBOE VIX Volatility (daily)",
    "WILL5000PR": "Wilshire 5000 Total Market (daily)",
    "TNWBSHNO": "Net Worth - Bottom 50% (quarterly)",
    "WFRBST01134": "Net Worth - Top 1% (quarterly)",
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "fred"


def main():
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set FRED_API_KEY environment variable. Get one at https://fred.stlouisfed.org/docs/api/api_key.html"
        )

    fred = Fred(api_key=api_key)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    failed = []
    for series_id, label in SERIES.items():
        print(f"Fetching {series_id} — {label}")
        try:
            s = fred.get_series(series_id)
            df = s.reset_index()
            df.columns = ["obs_date", "value"]
            df["series_id"] = series_id
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            frames.append(df)
        except Exception as e:
            print(f"  SKIPPED: {e}")
            failed.append(series_id)
        time.sleep(0.5)

    combined = pd.concat(frames, ignore_index=True)
    combined = combined[["series_id", "obs_date", "value"]]

    csv_path = OUTPUT_DIR / "fred_sample.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for sid in SERIES:
        n = len(combined[combined["series_id"] == sid])
        print(f"  {sid}: {n} observations")

    # Fetch metadata for each series
    print("\nFetching series metadata...")
    meta_rows = []
    for series_id, label in SERIES.items():
        try:
            info = fred.get_series_info(series_id)
            meta_rows.append({
                "series_id": series_id,
                "title": info.get("title", label),
                "units": info.get("units", ""),
                "frequency": info.get("frequency", ""),
                "seasonal_adjustment": info.get("seasonal_adjustment", ""),
                "last_updated": str(info.get("last_updated", "")),
                "category": label,
            })
            time.sleep(0.3)
        except Exception as e:
            print(f"  Warning: metadata fetch failed for {series_id}: {e}")
            meta_rows.append({
                "series_id": series_id,
                "title": label,
                "units": "",
                "frequency": "",
                "seasonal_adjustment": "",
                "last_updated": "",
                "category": label,
            })

    meta_df = pd.DataFrame(meta_rows)
    meta_path = OUTPUT_DIR / "fred_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} series metadata to {meta_path}")

    if failed:
        print(f"\nFailed series ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
