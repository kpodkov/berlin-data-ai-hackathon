"""Fetch market data (ETFs, indices, crypto) from Yahoo Finance.

Covers: US broad market, US sectors, US factors, US size, US dividend,
US fixed income, EU country ETFs, EU indices, international, real assets,
commodities, and crypto.
"""

import time
from pathlib import Path

import pandas as pd
import yfinance as yf

TICKERS = {
    # ── US Broad Market ────────────────────────────────────────────────
    "SPY": ("S&P 500 ETF", "us_broad"),
    "QQQ": ("Nasdaq 100 ETF", "us_broad"),
    "IWM": ("Russell 2000 ETF", "us_broad"),
    "MDY": ("S&P MidCap 400 ETF", "us_broad"),
    # ── US Sectors (Select Sector SPDRs) ───────────────────────────────
    "XLF": ("Financial Sector ETF", "us_sector"),
    "XLK": ("Technology Sector ETF", "us_sector"),
    "XLV": ("Healthcare Sector ETF", "us_sector"),
    "XLI": ("Industrial Sector ETF", "us_sector"),
    "XLE": ("Energy Sector ETF", "us_sector"),
    "XLRE": ("Real Estate Sector ETF", "us_sector"),
    "XLC": ("Communication Services ETF", "us_sector"),
    "XLB": ("Materials Sector ETF", "us_sector"),
    "XLP": ("Consumer Staples ETF", "us_sector"),
    "XLU": ("Utilities Sector ETF", "us_sector"),
    # ── US Factors ─────────────────────────────────────────────────────
    "VTV": ("Vanguard Value ETF", "us_factor"),
    "VUG": ("Vanguard Growth ETF", "us_factor"),
    "MTUM": ("iShares MSCI USA Momentum ETF", "us_factor"),
    "QUAL": ("iShares MSCI USA Quality ETF", "us_factor"),
    # ── US Dividend ────────────────────────────────────────────────────
    "VYM": ("Vanguard High Dividend Yield ETF", "us_dividend"),
    "SCHD": ("Schwab US Dividend Equity ETF", "us_dividend"),
    # ── US Fixed Income ────────────────────────────────────────────────
    "AGG": ("US Aggregate Bond ETF", "us_fixed_income"),
    "TLT": ("20+ Year Treasury Bond ETF", "us_fixed_income"),
    "TIP": ("TIPS Bond ETF", "us_fixed_income"),
    "SHY": ("1-3 Year Treasury Bond ETF", "us_fixed_income"),
    "IEF": ("7-10 Year Treasury Bond ETF", "us_fixed_income"),
    "LQD": ("Investment Grade Corporate Bond ETF", "us_fixed_income"),
    "HYG": ("High Yield Corporate Bond ETF", "us_fixed_income"),
    "BNDX": ("Vanguard Total Intl Bond ETF", "us_fixed_income"),
    # ── EU Country ETFs ────────────────────────────────────────────────
    "EZU": ("iShares MSCI Eurozone ETF", "eu_equity"),
    "FEZ": ("SPDR EURO STOXX 50 ETF", "eu_equity"),
    "EWG": ("iShares MSCI Germany ETF", "eu_equity"),
    "EWU": ("iShares MSCI UK ETF", "eu_equity"),
    "EWQ": ("iShares MSCI France ETF", "eu_equity"),
    "EWI": ("iShares MSCI Italy ETF", "eu_equity"),
    "EWP": ("iShares MSCI Spain ETF", "eu_equity"),
    "EWN": ("iShares MSCI Netherlands ETF", "eu_equity"),
    "EWD": ("iShares MSCI Sweden ETF", "eu_equity"),
    "EWL": ("iShares MSCI Switzerland ETF", "eu_equity"),
    "HEDJ": ("WisdomTree Europe Hedged Equity ETF", "eu_equity"),
    # ── EU Indices ─────────────────────────────────────────────────────
    "^STOXX50E": ("EURO STOXX 50 Index", "eu_index"),
    "^GDAXI": ("DAX Index (Germany)", "eu_index"),
    "^FTSE": ("FTSE 100 Index (UK)", "eu_index"),
    "^FCHI": ("CAC 40 Index (France)", "eu_index"),
    # ── International ──────────────────────────────────────────────────
    "VEA": ("Developed Markets ex-US ETF", "international"),
    "VWO": ("Emerging Markets ETF", "international"),
    "ACWI": ("iShares MSCI ACWI ETF", "international"),
    "VT": ("Vanguard Total World Stock ETF", "international"),
    "IEFA": ("iShares Core MSCI EAFE ETF", "international"),
    "IEMG": ("iShares Core MSCI EM ETF", "international"),
    # ── Real Assets & Commodities ──────────────────────────────────────
    "VNQ": ("Vanguard Real Estate ETF", "real_assets"),
    "GLD": ("Gold ETF", "real_assets"),
    "SLV": ("iShares Silver Trust", "real_assets"),
    "USO": ("United States Oil Fund", "real_assets"),
    "DBA": ("Invesco DB Agriculture Fund", "real_assets"),
    # ── Currency ───────────────────────────────────────────────────────
    "DX-Y.NYB": ("US Dollar Index", "currency"),
    "EURUSD=X": ("EUR/USD Exchange Rate", "currency"),
    "GBPUSD=X": ("GBP/USD Exchange Rate", "currency"),
    # ── Crypto ─────────────────────────────────────────────────────────
    "BTC-USD": ("Bitcoin USD", "crypto"),
    "ETH-USD": ("Ethereum USD", "crypto"),
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "yahoo"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    meta_rows = []
    failed = []

    for ticker, (label, category) in TICKERS.items():
        print(f"Fetching {ticker} — {label} [{category}]")
        try:
            data = yf.download(
                ticker, start="2000-01-01", progress=False, auto_adjust=True
            )
            if data.empty:
                print(f"  SKIPPED: no data returned")
                failed.append(ticker)
                continue

            close_col = "Close"
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)

            series_df = data[[close_col]].reset_index()
            series_df.columns = ["obs_date", "value"]
            series_df["series_id"] = ticker
            series_df["value"] = pd.to_numeric(series_df["value"], errors="coerce")
            frames.append(series_df)

            meta_rows.append({
                "series_id": ticker,
                "title": label,
                "units": "USD",
                "frequency": "Daily",
                "source": "Yahoo Finance",
                "category": category,
            })
            time.sleep(0.3)
        except Exception as e:
            print(f"  SKIPPED: {e}")
            failed.append(ticker)

    combined = pd.concat(frames, ignore_index=True)[["series_id", "obs_date", "value"]]
    csv_path = OUTPUT_DIR / "yahoo_observations.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for ticker in TICKERS:
        n = len(combined[combined["series_id"] == ticker])
        if n > 0:
            print(f"  {ticker}: {n} observations")

    meta_df = pd.DataFrame(meta_rows)
    meta_path = OUTPUT_DIR / "yahoo_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} ticker metadata to {meta_path}")

    if failed:
        print(f"\nFailed tickers ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
