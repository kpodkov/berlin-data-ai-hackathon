"""GET /api/investment-returns — monthly performance for requested tickers."""

from fastapi import APIRouter, HTTPException, Query

from api.cache import cache_get, cache_set
from api.db import query
from api.utils import camel_rows

router = APIRouter()

_ALLOWED_TICKERS = {
    "ACWI", "AGG", "BNDX", "BTC-USD", "DBA", "DX-Y.NYB", "ETH-USD",
    "EURUSD=X", "EWD", "EWG", "EWI", "EWL", "EWN", "EWP", "EWQ", "EWU",
    "EZU", "FEZ", "GBPUSD=X", "GLD", "HEDJ", "HYG", "IEF", "IEFA", "IEMG",
    "IWM", "LQD", "MDY", "MTUM", "QQQ", "QUAL", "SCHD", "SHY", "SLV",
    "SPY", "TIP", "TLT", "USO", "VEA", "VNQ", "VT", "VTV", "VUG", "VWO",
    "VYM", "XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU",
    "XLV", "^FCHI", "^FTSE", "^GDAXI", "^STOXX50E",
}

_SQL = """
SELECT
    SERIES_ID,
    TITLE,
    ASSET_CLASS,
    MONTH_KEY,
    MONTHLY_CLOSE,
    MONTHLY_RETURN_PCT,
    CUMULATIVE_RETURN_PCT,
    ROLLING_12M_RETURN_PCT,
    DRAWDOWN_PCT
FROM MART_INVESTMENT_PERFORMANCE
WHERE SERIES_ID IN ({placeholders})
ORDER BY SERIES_ID, MONTH_KEY
"""


@router.get("/investment-returns")
def get_investment_returns(
    tickers: str = Query(default="SPY,QQQ,AGG", description="Comma-separated ticker list"),
):
    requested = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not requested:
        raise HTTPException(status_code=400, detail="At least one ticker is required")

    # Validate against known set to prevent injection via the IN list
    unknown = [t for t in requested if t not in _ALLOWED_TICKERS]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tickers: {', '.join(unknown)}. Allowed: {', '.join(sorted(_ALLOWED_TICKERS))}",
        )

    cache_key = f"investments:{','.join(sorted(requested))}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    # Build parameterised IN clause — snowflake-connector uses %(name)s style
    placeholders = ", ".join(f"%(t{i})s" for i in range(len(requested)))
    params = {f"t{i}": t for i, t in enumerate(requested)}

    try:
        rows = query(_SQL.format(placeholders=placeholders), params)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    result = camel_rows(rows)
    cache_set(cache_key, result)
    return result
