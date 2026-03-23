"""Fetch market data (stocks, ETFs, crypto) from Yahoo Finance."""

import time
from pathlib import Path

import pandas as pd
import yfinance as yf

TICKERS = {
    # Core portfolio benchmarks
    "SPY": "S&P 500 ETF",
    "QQQ": "Nasdaq 100 ETF",
    "AGG": "US Aggregate Bond ETF",
    "TLT": "20+ Year Treasury Bond ETF",
    # Real assets & alternatives
    "VNQ": "Vanguard Real Estate ETF",
    "GLD": "Gold ETF",
    "XLE": "Energy Sector ETF",
    "TIP": "TIPS Bond ETF (inflation-protected)",
    # Currency
    "DX-Y.NYB": "US Dollar Index",
    # Crypto
    "BTC-USD": "Bitcoin USD",
    "ETH-USD": "Ethereum USD",
    # International
    "VEA": "Developed Markets ex-US ETF",
    "VWO": "Emerging Markets ETF",
}

OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "market"


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    frames = []
    meta_rows = []
    failed = []

    for ticker, label in TICKERS.items():
        print(f"Fetching {ticker} — {label}")
        try:
            data = yf.download(ticker, start="2000-01-01", progress=False, auto_adjust=True)
            if data.empty:
                print(f"  SKIPPED: no data returned")
                failed.append(ticker)
                continue

            # Use Close price as the canonical value
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
            })
            time.sleep(0.3)
        except Exception as e:
            print(f"  SKIPPED: {e}")
            failed.append(ticker)

    combined = pd.concat(frames, ignore_index=True)[["series_id", "obs_date", "value"]]
    csv_path = OUTPUT_DIR / "market_prices.csv"
    combined.to_csv(csv_path, index=False)
    print(f"\nSaved {len(combined)} rows to {csv_path}")

    for ticker in TICKERS:
        n = len(combined[combined["series_id"] == ticker])
        if n > 0:
            print(f"  {ticker}: {n} observations")

    meta_df = pd.DataFrame(meta_rows)
    meta_path = OUTPUT_DIR / "market_metadata.csv"
    meta_df.to_csv(meta_path, index=False)
    print(f"Saved {len(meta_df)} ticker metadata to {meta_path}")

    if failed:
        print(f"\nFailed tickers ({len(failed)}): {', '.join(failed)}")


if __name__ == "__main__":
    main()
