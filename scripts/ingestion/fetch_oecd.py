"""Fetch OECD indicators via the OECD SDMX REST API and save as CSV.

Covers: house price indices (real, price-to-income, price-to-rent),
composite leading indicators, and short-term interest rates.

Uses the OECD SDMX v1 API with content negotiation for CSV.
API docs: https://data-explorer.oecd.org/
"""

import io
import time
from pathlib import Path

import pandas as pd
import requests

# OECD SDMX v1 REST endpoint
OECD_BASE = "https://sdmx.oecd.org/public/rest/data"

COUNTRIES_3 = [
    "USA", "DEU", "GBR", "FRA", "ITA", "JPN", "CAN",
    "KOR", "AUS", "MEX", "ESP", "NLD", "CHE", "SWE",
    "NOR", "BEL", "AUT", "IRL", "PRT", "GRC", "FIN",
    "POL", "CZE", "DNK",
]

COUNTRY_NAMES = {
    "USA": "United States", "DEU": "Germany", "GBR": "United Kingdom",
    "FRA": "France", "ITA": "Italy", "JPN": "Japan", "CAN": "Canada",
    "KOR": "South Korea", "AUS": "Australia", "MEX": "Mexico",
    "ESP": "Spain", "NLD": "Netherlands", "CHE": "Switzerland",
    "SWE": "Sweden", "NOR": "Norway", "BEL": "Belgium", "AUT": "Austria",
    "IRL": "Ireland", "PRT": "Portugal", "GRC": "Greece", "FIN": "Finland",
    "POL": "Poland", "CZE": "Czech Republic", "DNK": "Denmark",
}

# Each dataset is a separate API call
DATASETS = [
    {
        "name": "Real House Price Index",
        "url": "https://stats.oecd.org/SDMX-JSON/data/HOUSE_PRICES/{countries}.RHPI.IDX2015/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_RHPI",
        "category": "house_prices",
        "frequency": "Quarterly",
        "units": "Index 2015=100",
    },
    {
        "name": "House Price to Income Ratio",
        "url": "https://stats.oecd.org/SDMX-JSON/data/HOUSE_PRICES/{countries}.PI_RATIO.IDX2015/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_HPI2INC",
        "category": "house_prices",
        "frequency": "Quarterly",
        "units": "Index 2015=100",
    },
    {
        "name": "House Price to Rent Ratio",
        "url": "https://stats.oecd.org/SDMX-JSON/data/HOUSE_PRICES/{countries}.PR_RATIO.IDX2015/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_HPI2RENT",
        "category": "house_prices",
        "frequency": "Quarterly",
        "units": "Index 2015=100",
    },
    {
        "name": "Composite Leading Indicator",
        "url": "https://stats.oecd.org/SDMX-JSON/data/MEI_CLI/{countries}.LOLITOAA.STSA.M/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_CLI",
        "category": "leading_indicators",
        "frequency": "Monthly",
        "units": "Amplitude adjusted",
    },
    {
        "name": "Short-Term Interest Rate",
        "url": "https://stats.oecd.org/SDMX-JSON/data/KEI/{countries}.IR3TIB01.ST.M/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_STIR",
        "category": "interest_rates",
        "frequency": "Monthly",
        "units": "% per annum",
    },
    {
        "name": "Long-Term Interest Rate",
        "url": "https://stats.oecd.org/SDMX-JSON/data/KEI/{countries}.IRLTLT01.ST.M/all?startTime=2000&json=jsondata",
        "series_prefix": "OECD_LTIR",
        "category": "interest_rates",
        "frequency": "Monthly",
        "units": "% per annum",
    },
]

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "oecd"


def parse_oecd_json(data: dict, prefix: str, name: str, cfg: dict) -> tuple[pd.DataFrame, list[dict]]:
    """Parse OECD SDMX-JSON response into observations + metadata."""
    obs_frames = []
    meta_rows = []

    datasets = data.get("dataSets", [])
    if not datasets:
        return pd.DataFrame(), []

    structure = data.get("structure", {})
    dimensions = structure.get("dimensions", {}).get("series", [])

    # Find country dimension
    country_dim_idx = None
    country_values = {}
    for i, dim in enumerate(dimensions):
        if dim.get("id") in ("LOCATION", "COU"):
            country_dim_idx = i
            for j, val in enumerate(dim.get("values", [])):
                country_values[j] = val.get("id", "")
            break

    if country_dim_idx is None:
        # Try first dimension as country
        country_dim_idx = 0
        for j, val in enumerate(dimensions[0].get("values", [])):
            country_values[j] = val.get("id", "")

    # Time periods
    obs_dims = structure.get("dimensions", {}).get("observation", [])
    time_values = {}
    for dim in obs_dims:
        if dim.get("id") == "TIME_PERIOD":
            for j, val in enumerate(dim.get("values", [])):
                time_values[j] = val.get("id", "")
            break

    series_data = datasets[0].get("series", {})
    for series_key, series_val in series_data.items():
        key_parts = series_key.split(":")
        country_idx = int(key_parts[country_dim_idx])
        country = country_values.get(country_idx, f"UNK{country_idx}")

        series_id = f"{prefix}_{country}"
        observations = series_val.get("observations", {})

        rows = []
        for time_idx_str, obs_val in observations.items():
            time_idx = int(time_idx_str)
            period = time_values.get(time_idx, "")
            value = obs_val[0] if obs_val else None
            if value is not None and period:
                rows.append({
                    "series_id": series_id,
                    "obs_date": period,
                    "value": value,
                })

        if rows:
            df = pd.DataFrame(rows)
            df["obs_date"] = pd.to_datetime(df["obs_date"], errors="coerce")
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna(subset=["obs_date"])
            obs_frames.append(df[["series_id", "obs_date", "value"]])

            display = COUNTRY_NAMES.get(country, country)
            meta_rows.append({
                "series_id": series_id,
                "title": f"{name} - {display}",
                "units": cfg["units"],
                "frequency": cfg["frequency"],
                "source": "OECD",
                "category": cfg["category"],
            })

    if obs_frames:
        return pd.concat(obs_frames, ignore_index=True), meta_rows
    return pd.DataFrame(), []


def fetch_dataset(cfg: dict) -> tuple[pd.DataFrame, list[dict]]:
    """Fetch one OECD dataset for all countries."""
    countries_str = "+".join(COUNTRIES_3)
    url = cfg["url"].replace("{countries}", countries_str)

    print(f"  GET {url[:100]}...")
    resp = requests.get(url, timeout=60)

    if resp.status_code != 200:
        print(f"  HTTP {resp.status_code}: {resp.text[:200]}")
        return pd.DataFrame(), []

    data = resp.json()
    return parse_oecd_json(data, cfg["series_prefix"], cfg["name"], cfg)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_obs = []
    all_meta = []
    failed = []

    for cfg in DATASETS:
        print(f"\nFetching {cfg['name']} [{cfg['category']}]")
        try:
            obs, meta = fetch_dataset(cfg)
            if not obs.empty:
                all_obs.append(obs)
                all_meta.extend(meta)
                print(f"  Got {len(obs)} observations, {len(meta)} series")
            else:
                print(f"  No data returned")
                failed.append(cfg["name"])
        except Exception as e:
            print(f"  FAILED: {e}")
            failed.append(cfg["name"])
        time.sleep(2)

    if not all_obs:
        print("\nNo OECD data fetched!")
        return

    combined = pd.concat(all_obs, ignore_index=True)
    csv_path = OUTPUT_DIR / "oecd_observations.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    meta_df = pd.DataFrame(all_meta)
    meta_path = OUTPUT_DIR / "oecd_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} series metadata to {meta_path}")

    if failed:
        print(f"\nFailed datasets ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
