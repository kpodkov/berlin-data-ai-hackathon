"""Fetch FRED time series and save as CSV.

Covers: macro, income, savings, debt, housing, CPI components, rates, credit
spreads, commodities, money supply, labor, wealth distribution, consumer/business,
EU macro (FRED-hosted), and OECD CLIs (FRED-hosted).
"""

import os
import time
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fredapi import Fred

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

SERIES = {
    # ── Macro ──────────────────────────────────────────────────────────
    "GDPC1": ("Real GDP", "macro"),
    "UNRATE": ("Unemployment Rate", "macro"),
    "INDPRO": ("Industrial Production Index", "macro"),
    "PAYEMS": ("Total Nonfarm Payrolls", "macro"),
    # ── Income & wages ─────────────────────────────────────────────────
    "PI": ("Personal Income", "income"),
    "CES0500000003": ("Avg Hourly Earnings - Private", "income"),
    "MEHOINUSA672N": ("Real Median Household Income", "income"),
    "A229RX0": ("Real Personal Income Per Capita", "income"),
    # ── Savings ────────────────────────────────────────────────────────
    "PSAVERT": ("Personal Savings Rate", "savings"),
    "SAVINGSL": ("Personal Savings Level", "savings"),
    # ── Debt & borrowing costs ─────────────────────────────────────────
    "MORTGAGE30US": ("30-Year Mortgage Rate", "debt"),
    "TERMCBCCALLNS": ("Credit Card Interest Rate", "debt"),
    "TOTALSL": ("Total Consumer Credit", "debt"),
    "REVOLSL": ("Revolving Consumer Credit", "debt"),
    "NONREVSL": ("Non-Revolving Consumer Credit", "debt"),
    "TDSP": ("Household Debt Service Ratio", "debt"),
    "BUSLOANS": ("Commercial & Industrial Loans", "debt"),
    # ── Housing ────────────────────────────────────────────────────────
    "CSUSHPISA": ("Case-Shiller Home Price Index", "housing"),
    "MSPUS": ("Median Home Sale Price", "housing"),
    "FIXHAI": ("Housing Affordability Index", "housing"),
    "CUSR0000SEHA": ("CPI Rent of Primary Residence", "housing"),
    "HOUST": ("Housing Starts", "housing"),
    "DRCRELEXFACBS": ("Delinquency Rate on RE Loans", "housing"),
    "RRVRUSQ156N": ("Rental Vacancy Rate", "housing"),
    "RHORUSQ156N": ("Homeownership Rate", "housing"),
    # ── CPI components ─────────────────────────────────────────────────
    "CPIAUCSL": ("CPI All Urban Consumers", "cpi"),
    "CPIUFDSL": ("CPI Food", "cpi"),
    "CPIENGSL": ("CPI Energy", "cpi"),
    "CPIMEDSL": ("CPI Medical Care", "cpi"),
    "CUSR0000SAE1": ("CPI Education", "cpi"),
    "CUUR0000SAT1": ("CPI Transportation", "cpi"),
    # ── Interest rates ─────────────────────────────────────────────────
    "FEDFUNDS": ("Fed Funds Rate", "rates"),
    "DGS10": ("10-Year Treasury Yield", "rates"),
    "DGS2": ("2-Year Treasury Yield", "rates"),
    "DGS30": ("30-Year Treasury Yield", "rates"),
    "DGS5": ("5-Year Treasury Yield", "rates"),
    "DTB3": ("3-Month Treasury Bill Rate", "rates"),
    # ── Credit spreads & yield curve ───────────────────────────────────
    "BAMLH0A0HYM2": ("ICE BofA US High Yield Spread", "spreads"),
    "BAMLC0A0CM": ("ICE BofA US Corporate Spread", "spreads"),
    "T10Y2Y": ("10Y-2Y Treasury Spread", "spreads"),
    "T10Y3M": ("10Y-3M Treasury Spread", "spreads"),
    # ── Commodities (via FRED) ─────────────────────────────────────────
    "DCOILWTICO": ("WTI Crude Oil Price", "commodities"),
    "DCOILBRENTEU": ("Brent Crude Oil Price", "commodities"),
    "GOLDPMGBD228NLBM": ("Gold Price London Fix", "commodities"),
    # ── Money supply ───────────────────────────────────────────────────
    "M2SL": ("M2 Money Supply", "money_supply"),
    "BOGMBASE": ("Monetary Base", "money_supply"),
    # ── Labor market detail ────────────────────────────────────────────
    "JTSJOL": ("Job Openings JOLTS", "labor"),
    "ICSA": ("Initial Jobless Claims", "labor"),
    "CIVPART": ("Labor Force Participation Rate", "labor"),
    "EMRATIO": ("Employment-Population Ratio", "labor"),
    # ── Consumer & business ────────────────────────────────────────────
    "UMCSENT": ("Consumer Sentiment UMich", "consumer"),
    "RSAFS": ("Retail Sales", "consumer"),
    # ── Stock market & wealth ──────────────────────────────────────────
    "SP500": ("S&P 500 Index", "markets"),
    "VIXCLS": ("CBOE VIX Volatility", "markets"),
    "WILL5000PR": ("Wilshire 5000 Total Market", "markets"),
    "TNWBSHNO": ("Net Worth - Bottom 50%", "wealth"),
    "WFRBST01134": ("Net Worth - Top 1%", "wealth"),
    "WFRBLB50107": ("Net Worth Bottom 50% Share", "wealth"),
    "WFRBLN40080": ("Net Worth Next 40% Share", "wealth"),
    "WFRBLT01026": ("Net Worth Top 1% Share", "wealth"),
    # ── Trade ──────────────────────────────────────────────────────────
    "BOPGSTB": ("Trade Balance Goods & Services", "trade"),
    "NETEXP": ("Net Exports of Goods & Services", "trade"),
    # ── EU macro (FRED-hosted) ─────────────────────────────────────────
    "ECBDFR": ("ECB Deposit Facility Rate", "eu_macro"),
    "ECBMRRFR": ("ECB Main Refinancing Rate", "eu_macro"),
    "CLVMNACSCAB1GQEA19": ("Real GDP Euro Area", "eu_macro"),
    "EA19CPALTT01GYM": ("Euro Area CPI YoY", "eu_macro"),
    "LRHUTTTTEZM156S": ("Euro Area Unemployment Rate", "eu_macro"),
    # ── OECD CLIs (FRED-hosted) ────────────────────────────────────────
    "USALOLITONOSTSAM": ("OECD CLI USA", "oecd_cli"),
    "DEULOITOTONOSTSAM": ("OECD CLI Germany", "oecd_cli"),
    "GBRLOITOTONOSTSAM": ("OECD CLI United Kingdom", "oecd_cli"),
    "FRALOITOTONOSTSAM": ("OECD CLI France", "oecd_cli"),
    "JPNLOITOTONOSTSAM": ("OECD CLI Japan", "oecd_cli"),
    "CHNLOITOTONOSTSAM": ("OECD CLI China", "oecd_cli"),
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "fred"


def main():
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set FRED_API_KEY environment variable. "
            "Get one at https://fred.stlouisfed.org/docs/api/api_key.html"
        )

    fred = Fred(api_key=api_key)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    failed = []
    for series_id, (label, category) in SERIES.items():
        print(f"Fetching {series_id} — {label} [{category}]")
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

    csv_path = OUTPUT_DIR / "fred_observations.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for sid in SERIES:
        n = len(combined[combined["series_id"] == sid])
        if n > 0:
            print(f"  {sid}: {n} observations")

    # Fetch metadata
    print("\nFetching series metadata...")
    meta_rows = []
    for series_id, (label, category) in SERIES.items():
        try:
            info = fred.get_series_info(series_id)
            meta_rows.append({
                "series_id": series_id,
                "title": info.get("title", label),
                "units": info.get("units", ""),
                "frequency": info.get("frequency", ""),
                "source": "FRED",
                "category": category,
            })
            time.sleep(0.3)
        except Exception as e:
            print(f"  Warning: metadata for {series_id}: {e}")
            meta_rows.append({
                "series_id": series_id,
                "title": label,
                "units": "",
                "frequency": "",
                "source": "FRED",
                "category": category,
            })

    meta_df = pd.DataFrame(meta_rows)
    meta_path = OUTPUT_DIR / "fred_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} series metadata to {meta_path}")

    if failed:
        print(f"\nFailed series ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
