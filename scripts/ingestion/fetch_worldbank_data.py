"""Fetch international personal finance indicators from World Bank."""

import time
from pathlib import Path

import pandas as pd
import wbgapi as wb

INDICATORS = {
    # Income & purchasing power
    "NY.GDP.PCAP.PP.CD": "GDP per Capita PPP (current USD)",
    "PA.NUS.PPP": "PPP Conversion Factor",
    # Inflation & cost of living
    "FP.CPI.TOTL.ZG": "Inflation Rate (CPI annual %)",
    # Employment
    "SL.UEM.TOTL.ZS": "Unemployment Rate (%)",
    # Savings & debt
    "NY.GNS.ICTR.ZS": "Gross Savings (% of GDP)",
    "FR.INR.RINR": "Real Interest Rate (%)",
    # Inequality
    "SI.POV.GINI": "Gini Index",
    "SI.DST.10TH.10": "Income Share Top 10%",
    # Remittances & migration
    "BX.TRF.PWKR.CD.DT": "Personal Remittances Received (USD)",
    # Life expectancy (financial planning horizon)
    "SP.DYN.LE00.IN": "Life Expectancy at Birth (years)",
}

# G7 + BRICS + interesting comparators
COUNTRIES = [
    "USA", "DEU", "GBR", "JPN", "FRA", "CAN", "ITA",  # G7
    "CHN", "IND", "BRA", "ZAF",                         # BRICS
    "KOR", "AUS", "MEX", "NGA",                          # Comparators
]

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "worldbank"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    meta_rows = []
    failed = []

    for indicator, label in INDICATORS.items():
        print(f"Fetching {indicator} — {label}")
        try:
            df = wb.data.DataFrame(
                indicator, COUNTRIES, time=range(2000, 2026), labels=False
            )
            if df.empty:
                print(f"  SKIPPED: no data")
                failed.append(indicator)
                continue

            # wbgapi: rows=countries, columns=YR2000..YR2024
            melted = df.reset_index().melt(
                id_vars=["economy"], var_name="year", value_name="value"
            )
            melted = melted.dropna(subset=["value"])
            melted["obs_date"] = pd.to_datetime(
                melted["year"].str.replace("YR", ""), format="%Y"
            )
            # Encode country into series_id: "FP.CPI.TOTL.ZG_USA"
            melted["series_id"] = indicator + "_" + melted["economy"]
            frames.append(melted[["series_id", "obs_date", "value"]])

            for country in melted["economy"].unique():
                meta_rows.append({
                    "series_id": f"{indicator}_{country}",
                    "title": f"{label} - {country}",
                    "units": label.split("(")[-1].rstrip(")") if "(" in label else "",
                    "frequency": "Annual",
                    "source": "World Bank",
                })
            time.sleep(0.3)
        except Exception as e:
            print(f"  SKIPPED: {e}")
            failed.append(indicator)

    if not frames:
        print("No data fetched!")
        return

    combined = pd.concat(frames, ignore_index=True)
    csv_path = OUTPUT_DIR / "worldbank_indicators.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    indicators_found = combined["series_id"].str.rsplit("_", n=1).str[0].unique()
    for ind in indicators_found:
        n = len(combined[combined["series_id"].str.startswith(ind)])
        print(f"  {ind}: {n} observations")

    meta_df = pd.DataFrame(meta_rows)
    meta_path = OUTPUT_DIR / "worldbank_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} series metadata to {meta_path}")

    if failed:
        print(f"\nFailed indicators ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
