"""Consumer insights endpoint — JustWatch behavioral data aggregated by wealth tier."""

from fastapi import APIRouter
from api.db import query
from api.cache import cache_get, cache_set
from api.utils import camel_row, camel_rows

router = APIRouter()

# Sampled table reference — Snowflake SAMPLE syntax goes directly on the table
_SAMPLE_TABLE = "DB_TEAM_3.MARTS.MART_PERSONALIZED_ADVISOR SAMPLE (10000 ROWS)"


def _income_to_tier(income: float) -> str:
    if income >= 150000:
        return "Premium"
    if income >= 100000:
        return "Affluent"
    if income >= 50000:
        return "Middle"
    return "Budget"


@router.get("/api/consumer-insights")
def get_consumer_insights(income: float = 50000):
    """
    Aggregate JustWatch consumer data by wealth tier.
    Uses a 10K random sample for performance.
    """
    cache_key = f"consumer:{int(income)}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    user_tier = _income_to_tier(income)

    # Aggregate stats per wealth tier (sampled)
    tier_stats = query(f"""
        SELECT
            WEALTH_TIER,
            COUNT(DISTINCT USER_ID) AS total_users,
            ROUND(AVG(FINANCIAL_SCORE), 1) AS avg_financial_score,
            MODE(MACRO_FOCUS) AS dominant_concern,
            MODE(SPENDING_WILLINGNESS) AS typical_spending,
            MODE(REGIME_LABEL) AS macro_regime
        FROM {_SAMPLE_TABLE}
        GROUP BY WEALTH_TIER
        ORDER BY CASE WEALTH_TIER
            WHEN 'Budget'   THEN 1
            WHEN 'Middle'   THEN 2
            WHEN 'Affluent' THEN 3
            WHEN 'Premium'  THEN 4
        END
    """)

    # Spending willingness distribution for user's tier (sampled)
    spending_dist = query(f"""
        SELECT
            SPENDING_WILLINGNESS,
            COUNT(DISTINCT USER_ID) AS users
        FROM {_SAMPLE_TABLE}
        WHERE WEALTH_TIER = '{user_tier}'
        GROUP BY SPENDING_WILLINGNESS
        ORDER BY users DESC
    """)

    # Top segments for user's tier (sampled)
    segments = query(f"""
        SELECT
            SEGMENT,
            COUNT(DISTINCT USER_ID) AS users,
            ROUND(AVG(FINANCIAL_SCORE), 1) AS avg_score
        FROM {_SAMPLE_TABLE}
        WHERE WEALTH_TIER = '{user_tier}'
        GROUP BY SEGMENT
        ORDER BY users DESC
        LIMIT 5
    """)

    # Consumer confidence proxy (sampled)
    confidence = query(f"""
        SELECT
            ROUND(
                SUM(CASE WHEN SEGMENT IN ('Premium Buyer', 'Subscription Stacker') THEN 1 ELSE 0 END) * 100.0
                / NULLIF(SUM(CASE WHEN SEGMENT IN ('Deal Hunter', 'One-Shot Visitor') THEN 1 ELSE 0 END), 0),
            1) AS confidence_ratio,
            COUNT(DISTINCT USER_ID) AS total_users
        FROM {_SAMPLE_TABLE}
    """)

    # EU macro context (single row, no sampling needed)
    eu_context = query("""
        SELECT DISTINCT
            EUR_USD_RATE,
            EUR_USD_TREND,
            EU_INFLATION_RATE,
            ECB_DEPOSIT_RATE
        FROM DB_TEAM_3.MARTS.MART_PERSONALIZED_ADVISOR
        WHERE EUR_USD_RATE IS NOT NULL
        LIMIT 1
    """)

    result = {
        "userTier": user_tier,
        "tiers": camel_rows(tier_stats),
        "spendingDistribution": camel_rows(spending_dist),
        "topSegments": camel_rows(segments),
        "consumerConfidence": camel_row(confidence[0]) if confidence else None,
        "euContext": camel_row(eu_context[0]) if eu_context else None,
        "totalUsers": sum(int(t.get("total_users", 0) or 0) for t in tier_stats),
        "source": "JustWatch behavioral data · 10K sample · Germany Dec 2025",
    }

    cache_set(cache_key, result, ttl=3600)
    return result
