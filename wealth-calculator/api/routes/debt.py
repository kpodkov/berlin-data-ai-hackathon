"""GET /api/debt-history — debt burden trends for the last N months."""

from fastapi import APIRouter, HTTPException, Query

from api.cache import cache_get, cache_set
from api.db import query
from api.utils import camel_rows

router = APIRouter()

_SQL = """
SELECT
    OBS_MONTH,
    MORTGAGE_RATE,
    CREDIT_CARD_RATE,
    FED_FUNDS_RATE,
    CREDIT_CARD_SPREAD,
    TOTAL_CREDIT,
    REVOLVING_CREDIT,
    NONREVOLVING_CREDIT,
    REVOLVING_PCT_OF_TOTAL,
    DEBT_SERVICE_RATIO,
    TOTAL_CREDIT_YOY
FROM MART_DEBT_BURDEN
WHERE OBS_MONTH >= DATEADD('month', %(neg_months)s, CURRENT_DATE())
ORDER BY OBS_MONTH
"""


@router.get("/debt-history")
def get_debt_history(
    months: int = Query(default=60, ge=1, le=600, description="Number of months of history"),
):
    cache_key = f"debt:{months}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        rows = query(_SQL, {"neg_months": -months})
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    result = camel_rows(rows)
    cache_set(cache_key, result)
    return result
