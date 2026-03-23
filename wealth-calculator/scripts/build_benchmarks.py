"""
build_benchmarks.py

Reads pre-extracted FRED and ETF JSON files and writes public/data/benchmarks.json.
No Snowflake queries — pure local computation.
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def load_json(filename: str) -> dict:
    path = DATA_DIR / filename
    with open(path) as f:
        return json.load(f)


def latest_value(series: list[dict]) -> float | None:
    """Return the value of the last observation in a series."""
    if not series:
        return None
    return series[-1]["value"]


def latest_close(series: list[dict]) -> float | None:
    """Return the close price of the last observation in an ETF series."""
    if not series:
        return None
    return series[-1]["close"]


def yoy_pct(series: list[dict], value_key: str = "value") -> float | None:
    """
    Compute year-over-year percentage change.

    Finds the observation closest to 12 months before the latest date,
    then returns (latest - prior) / prior * 100.
    """
    if not series:
        return None

    latest_obs = series[-1]
    latest_date = datetime.strptime(latest_obs["date"], "%Y-%m-%d")
    target_date = latest_date - timedelta(days=365)

    # Find observation whose date is closest to target_date
    prior_obs = min(
        series,
        key=lambda obs: abs(
            (datetime.strptime(obs["date"], "%Y-%m-%d") - target_date).days
        ),
    )

    latest_val = latest_obs[value_key]
    prior_val = prior_obs[value_key]

    if prior_val is None or prior_val == 0:
        return None

    return round((latest_val - prior_val) / prior_val * 100, 4)


def cagr(series: list[dict], years: int, close_key: str = "close") -> float | None:
    """
    Compute CAGR over a lookback of `years`.

    end_price  = latest close
    start_price = close price closest to `years` ago from latest date
    CAGR = (end / start)^(1/years) - 1
    """
    if not series:
        return None

    latest_obs = series[-1]
    latest_date = datetime.strptime(latest_obs["date"], "%Y-%m-%d")
    target_date = latest_date - timedelta(days=years * 365)

    # Only consider observations on or before the target date
    candidates = [
        obs
        for obs in series
        if datetime.strptime(obs["date"], "%Y-%m-%d")
        <= latest_date - timedelta(days=years * 365 - 30)
    ]

    if not candidates:
        return None

    # Pick observation closest to target date
    start_obs = min(
        candidates,
        key=lambda obs: abs(
            (datetime.strptime(obs["date"], "%Y-%m-%d") - target_date).days
        ),
    )

    end_price = latest_obs[close_key]
    start_price = start_obs[close_key]

    if start_price is None or start_price <= 0:
        return None

    return round((end_price / start_price) ** (1 / years) - 1, 4)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    fred = load_json("fred_series.json")
    etf = load_json("etf_prices.json")

    generated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # ------------------------------------------------------------------
    # Latest FRED point values
    # ------------------------------------------------------------------
    median_hh_income = round(latest_value(fred.get("MEHOINUSA672N", [])), 2)
    savings_rate = round(latest_value(fred.get("PSAVERT", [])), 4)
    median_home_price = round(latest_value(fred.get("MSPUS", [])), 2)
    mortgage_rate_30y = round(latest_value(fred.get("MORTGAGE30US", [])), 4)
    credit_card_rate = round(latest_value(fred.get("TERMCBCCALLNS", [])), 4)
    debt_service_ratio = round(latest_value(fred.get("TDSP", [])), 4)

    # ------------------------------------------------------------------
    # CPI YoY rates
    # ------------------------------------------------------------------
    cpi_series_ids = [
        "CPIAUCSL",
        "CPIUFDSL",
        "CPIENGSL",
        "CPIMEDSL",
        "CUSR0000SAE1",
        "CUSR0000SEHA",
        "CUUR0000SAT1",
    ]

    cpi_yoy: dict[str, float | None] = {}
    for sid in cpi_series_ids:
        cpi_yoy[sid] = yoy_pct(fred.get(sid, []))

    headline_cpi_yoy = cpi_yoy.get("CPIAUCSL")

    # ------------------------------------------------------------------
    # ETF CAGRs
    # ------------------------------------------------------------------
    etf_tickers = ["SPY", "QQQ", "AGG"]
    lookbacks = [1, 5, 10, 20]
    lookback_keys = {1: "y1", 5: "y5", 10: "y10", 20: "y20"}

    etf_cagr: dict[str, dict[str, float | None]] = {}
    for ticker in etf_tickers:
        series = etf.get(ticker, [])
        etf_cagr[ticker] = {lookback_keys[y]: cagr(series, y) for y in lookbacks}

    # ------------------------------------------------------------------
    # Assemble output
    # ------------------------------------------------------------------
    benchmarks = {
        "generatedAt": generated_at,
        "medianHouseholdIncome": median_hh_income,
        "savingsRate": savings_rate,
        "medianHomePrice": median_home_price,
        "mortgageRate30y": mortgage_rate_30y,
        "creditCardRate": credit_card_rate,
        "debtServiceRatio": debt_service_ratio,
        "headlineCpiYoy": headline_cpi_yoy,
        "cpiYoy": cpi_yoy,
        "etfCagr": etf_cagr,
    }

    # ------------------------------------------------------------------
    # Write output
    # ------------------------------------------------------------------
    out_path = DATA_DIR / "benchmarks.json"
    with open(out_path, "w") as f:
        json.dump(benchmarks, f, indent=2)

    # ------------------------------------------------------------------
    # Print summary
    # ------------------------------------------------------------------
    print(f"Written: {out_path}")
    print(f"Generated at: {generated_at}")
    print()
    print("=== FRED Point Values ===")
    print(f"  Median Household Income : ${median_hh_income:,.2f}")
    print(f"  Savings Rate            : {savings_rate}%")
    print(f"  Median Home Price       : ${median_home_price:,.2f}")
    print(f"  30Y Mortgage Rate       : {mortgage_rate_30y}%")
    print(f"  Credit Card Rate        : {credit_card_rate}%")
    print(f"  Debt Service Ratio      : {debt_service_ratio}%")
    print()
    print("=== CPI YoY Rates ===")
    for sid, val in cpi_yoy.items():
        label = f"{val:+.4f}%" if val is not None else "N/A"
        print(f"  {sid:<20} : {label}")
    print()
    print("=== ETF CAGRs ===")
    for ticker, periods in etf_cagr.items():
        parts = "  ".join(
            f"{k}: {v*100:+.2f}%" if v is not None else f"{k}: N/A"
            for k, v in periods.items()
        )
        print(f"  {ticker}  {parts}")

    # ------------------------------------------------------------------
    # Validation warnings
    # ------------------------------------------------------------------
    warnings = []
    for sid, val in cpi_yoy.items():
        if val is not None and not (-10 <= val <= 30):
            warnings.append(f"CPI YoY out of range [{sid}]: {val}")
    for ticker, periods in etf_cagr.items():
        for period, val in periods.items():
            if val is not None and not (-0.20 <= val <= 0.30):
                warnings.append(f"CAGR out of range [{ticker}/{period}]: {val}")
    if median_hh_income is not None and median_hh_income <= 0:
        warnings.append(f"medianHouseholdIncome not positive: {median_hh_income}")
    if median_home_price is not None and median_home_price <= 0:
        warnings.append(f"medianHomePrice not positive: {median_home_price}")

    if warnings:
        print()
        print("=== VALIDATION WARNINGS ===")
        for w in warnings:
            print(f"  WARNING: {w}", file=sys.stderr)
    else:
        print()
        print("All values passed validation checks.")


if __name__ == "__main__":
    main()
