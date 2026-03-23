"""Fetch World Bank development indicators and save as CSV.

Covers: income, inflation, employment, savings, inequality, debt, financial
markets, demographics, and trade balance across G7, BRICS, EU, and key
comparator countries.
"""

import time
from pathlib import Path

import pandas as pd
import wbgapi as wb

INDICATORS = {
    # ── Income & purchasing power ──────────────────────────────────────
    "NY.GDP.PCAP.PP.CD": ("GDP per Capita PPP (current USD)", "income"),
    "PA.NUS.PPP": ("PPP Conversion Factor", "income"),
    "NY.GDP.MKTP.KD.ZG": ("GDP Growth Rate (%)", "income"),
    # ── Inflation & cost of living ─────────────────────────────────────
    "FP.CPI.TOTL.ZG": ("Inflation Rate CPI (%)", "inflation"),
    "FP.CPI.TOTL": ("Consumer Price Index (2010=100)", "inflation"),
    # ── Employment ─────────────────────────────────────────────────────
    "SL.UEM.TOTL.ZS": ("Unemployment Rate (%)", "employment"),
    "SL.TLF.CACT.ZS": ("Labor Force Participation Rate (%)", "employment"),
    # ── Savings & debt ─────────────────────────────────────────────────
    "NY.GNS.ICTR.ZS": ("Gross Savings (% of GDP)", "savings"),
    "FR.INR.RINR": ("Real Interest Rate (%)", "rates"),
    "GC.DOD.TOTL.GD.ZS": ("Central Government Debt (% of GDP)", "debt"),
    "FD.AST.PRVT.GD.ZS": ("Domestic Credit to Private Sector (% of GDP)", "debt"),
    # ── Financial markets ──────────────────────────────────────────────
    "CM.MKT.LCAP.GD.ZS": ("Market Capitalization (% of GDP)", "financial_markets"),
    # ── Inequality ─────────────────────────────────────────────────────
    "SI.POV.GINI": ("Gini Index", "inequality"),
    "SI.DST.10TH.10": ("Income Share Top 10%", "inequality"),
    # ── Demographics ───────────────────────────────────────────────────
    "SP.DYN.LE00.IN": ("Life Expectancy at Birth (years)", "demographics"),
    "SP.POP.TOTL": ("Total Population", "demographics"),
    # ── Trade & remittances ────────────────────────────────────────────
    "BN.CAB.XOKA.GD.ZS": ("Current Account Balance (% of GDP)", "trade"),
    "BX.TRF.PWKR.CD.DT": ("Personal Remittances Received (USD)", "trade"),
    "NE.CON.GOVT.ZS": ("Government Consumption (% of GDP)", "trade"),
}

# G7 + BRICS + EU members + key comparators
COUNTRIES = [
    # G7
    "USA", "DEU", "GBR", "JPN", "FRA", "CAN", "ITA",
    # BRICS
    "CHN", "IND", "BRA", "ZAF", "RUS",
    # EU members
    "ESP", "NLD", "BEL", "AUT", "IRL", "PRT", "GRC", "FIN",
    "POL", "CZE", "DNK", "SWE",
    # Other comparators
    "CHE", "NOR", "KOR", "AUS", "MEX", "NGA", "SGP", "ISR", "TUR",
]

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "worldbank"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    meta_rows = []
    failed = []

    for indicator, (label, category) in INDICATORS.items():
        print(f"Fetching {indicator} — {label} [{category}]")
        try:
            df = wb.data.DataFrame(
                indicator, COUNTRIES, time=range(2000, 2027), labels=False
            )
            if df.empty:
                print(f"  SKIPPED: no data")
                failed.append(indicator)
                continue

            melted = df.reset_index().melt(
                id_vars=["economy"], var_name="year", value_name="value"
            )
            melted = melted.dropna(subset=["value"])
            melted["obs_date"] = pd.to_datetime(
                melted["year"].str.replace("YR", ""), format="%Y"
            )
            melted["series_id"] = indicator + "_" + melted["economy"]
            frames.append(melted[["series_id", "obs_date", "value"]])

            for country in melted["economy"].unique():
                meta_rows.append({
                    "series_id": f"{indicator}_{country}",
                    "title": f"{label} - {country}",
                    "units": label.split("(")[-1].rstrip(")") if "(" in label else "",
                    "frequency": "Annual",
                    "source": "World Bank",
                    "category": category,
                })
            time.sleep(0.3)
        except Exception as e:
            print(f"  SKIPPED: {e}")
            failed.append(indicator)

    if not frames:
        print("No data fetched!")
        return

    combined = pd.concat(frames, ignore_index=True)
    csv_path = OUTPUT_DIR / "worldbank_observations.csv"
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
