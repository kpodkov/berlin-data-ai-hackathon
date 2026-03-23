"""GET /api/inflation-history — monthly CPI series for the last N months."""

from fastapi import APIRouter, HTTPException, Query

from api.cache import cache_get, cache_set
from api.db import query
from api.utils import camel_rows

router = APIRouter()

_SQL = """
SELECT
    OBS_MONTH,
    CPI_ALL_YOY,
    CPI_FOOD_YOY,
    CPI_ENERGY_YOY,
    CPI_MEDICAL_YOY,
    CPI_EDUCATION_YOY,
    CPI_TRANSPORTATION_YOY,
    CPI_RENT_YOY,
    PURCHASING_POWER_INDEX
FROM MART_INFLATION_IMPACT
WHERE OBS_MONTH >= DATEADD('month', %(neg_months)s, CURRENT_DATE())
ORDER BY OBS_MONTH
"""


@router.get("/inflation-history")
def get_inflation_history(
    months: int = Query(default=120, ge=1, le=600, description="Number of months of history"),
):
    cache_key = f"inflation:{months}"
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
