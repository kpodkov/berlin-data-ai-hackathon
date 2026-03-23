"""GET /api/housing-history — housing affordability trends for the last N months."""

from fastapi import APIRouter, HTTPException, Query

from api.cache import cache_get, cache_set
from api.db import query
from api.utils import camel_rows

router = APIRouter()

_SQL = """
SELECT
    OBS_MONTH,
    MEDIAN_HOME_PRICE,
    HOME_PRICE_INDEX,
    MORTGAGE_RATE,
    RENT_INDEX,
    HOUSING_STARTS,
    MEDIAN_INCOME_ANNUAL,
    MONTHLY_MORTGAGE_PAYMENT,
    HOME_PRICE_TO_INCOME_RATIO,
    MORTGAGE_PCT_OF_INCOME,
    RENT_YOY
FROM MART_HOUSING_AFFORDABILITY
WHERE OBS_MONTH >= DATEADD('month', %(neg_months)s, CURRENT_DATE())
ORDER BY OBS_MONTH
"""


@router.get("/housing-history")
def get_housing_history(
    months: int = Query(default=60, ge=1, le=600, description="Number of months of history"),
):
    cache_key = f"housing:{months}"
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
