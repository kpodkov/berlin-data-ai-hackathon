"""GET /api/benchmarks — latest snapshot from every MARTS table."""

from fastapi import APIRouter, HTTPException

from api.cache import cache_get, cache_set
from api.db import query
from api.utils import camel_row

router = APIRouter()

_CACHE_KEY = "benchmarks"


@router.get("/benchmarks")
def get_benchmarks():
    cached = cache_get(_CACHE_KEY)
    if cached is not None:
        return cached

    try:
        inflation = query(
            "SELECT * FROM MART_INFLATION_IMPACT ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        debt = query(
            "SELECT * FROM MART_DEBT_BURDEN ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        housing = query(
            "SELECT * FROM MART_HOUSING_AFFORDABILITY ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        savings = query(
            "SELECT * FROM MART_SAVINGS_HEALTH ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        currency = query(
            "SELECT * FROM MART_CURRENCY_ENVIRONMENT WHERE CATEGORY = 'exchange_rates' ORDER BY MONTH_DATE DESC LIMIT 15"
        )
        eu_inflation = query(
            "SELECT * FROM MART_CURRENCY_ENVIRONMENT WHERE CATEGORY = 'inflation' ORDER BY MONTH_DATE DESC LIMIT 12"
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    from api.utils import camel_rows
    result = {
        "inflation": camel_row(inflation[0]) if inflation else None,
        "debt": camel_row(debt[0]) if debt else None,
        "housing": camel_row(housing[0]) if housing else None,
        "savings": camel_row(savings[0]) if savings else None,
        "currency": camel_rows(currency) if currency else [],
        "euInflation": camel_rows(eu_inflation) if eu_inflation else [],
    }

    cache_set(_CACHE_KEY, result)
    return result
