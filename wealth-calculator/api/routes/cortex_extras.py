"""Cortex AI endpoints: briefing, explain, sentiment, ask."""

from fastapi import APIRouter
from pydantic import BaseModel

from api.cache import cache_get, cache_set
from api.cortex import (
    build_briefing_prompt,
    build_explain_prompt,
    cortex_complete,
    cortex_sentiment,
)
from api.db import query

router = APIRouter(prefix="/api/cortex", tags=["cortex"])


@router.get("/briefing")
async def get_briefing():
    """AI-generated 2-3 sentence economic conditions summary. Cached 24hr."""
    cached = cache_get("briefing")
    if cached:
        return cached

    inflation = query("SELECT * FROM DB_TEAM_3.MARTS.MART_INFLATION_IMPACT ORDER BY OBS_MONTH DESC LIMIT 1")
    debt = query("SELECT * FROM DB_TEAM_3.MARTS.MART_DEBT_BURDEN ORDER BY OBS_MONTH DESC LIMIT 1")
    savings = query("SELECT * FROM DB_TEAM_3.MARTS.MART_SAVINGS_HEALTH ORDER BY OBS_MONTH DESC LIMIT 1")
    investment = query("SELECT * FROM DB_TEAM_3.MARTS.MART_INVESTMENT_PERFORMANCE WHERE SERIES_ID = 'SPY' ORDER BY MONTH_KEY DESC LIMIT 1")

    i = inflation[0] if inflation else {}
    d = debt[0] if debt else {}
    s = savings[0] if savings else {}
    m = investment[0] if investment else {}

    prompt = build_briefing_prompt(
        cpi_yoy=float(i.get("cpi_all_yoy", 0) or 0),
        food_yoy=float(i.get("cpi_food_yoy", 0) or 0),
        medical_yoy=float(i.get("cpi_medical_yoy", 0) or 0),
        rent_yoy=float(i.get("cpi_rent_yoy", 0) or 0),
        fed_funds=float(d.get("fed_funds_rate", 0) or 0),
        mortgage_rate=float(d.get("mortgage_rate", 0) or 0),
        spy_return=float(m.get("rolling_12m_return_pct", 0) or 0),
        savings_rate=float(s.get("savings_rate", 0) or 0),
    )

    briefing = cortex_complete("mistral-large2", prompt)
    data_date = i.get("obs_month", "")

    result = {"briefing": briefing, "dataDate": str(data_date)}
    cache_set("briefing", result, ttl=86400)
    return result


class ExplainRequest(BaseModel):
    metric: str
    value: float
    context: str = ""


@router.post("/explain")
async def explain_metric(req: ExplainRequest):
    """2-sentence contextual explanation of a financial metric. Uses llama3.1-8b for speed."""
    bucketed = round(req.value * 2) / 2
    cache_key = f"explain:{req.metric}:{bucketed}"

    cached = cache_get(cache_key)
    if cached:
        return cached

    prompt = build_explain_prompt(req.metric, req.value, req.context)
    explanation = cortex_complete("llama3.1-8b", prompt)

    result = {"explanation": explanation, "metric": req.metric}
    cache_set(cache_key, result, ttl=3600)
    return result


@router.get("/sentiment")
async def get_sentiment():
    """Market sentiment score from economic conditions. Cached 24hr."""
    cached = cache_get("sentiment")
    if cached:
        return cached

    inflation = query("SELECT * FROM DB_TEAM_3.MARTS.MART_INFLATION_IMPACT ORDER BY OBS_MONTH DESC LIMIT 1")
    savings = query("SELECT * FROM DB_TEAM_3.MARTS.MART_SAVINGS_HEALTH ORDER BY OBS_MONTH DESC LIMIT 1")
    investment = query("SELECT * FROM DB_TEAM_3.MARTS.MART_INVESTMENT_PERFORMANCE WHERE SERIES_ID = 'SPY' ORDER BY MONTH_KEY DESC LIMIT 1")

    i = inflation[0] if inflation else {}
    s = savings[0] if savings else {}
    m = investment[0] if investment else {}

    text = (
        f"US inflation at {i.get('cpi_all_yoy', 'unknown')}%, "
        f"fed funds rate {s.get('fed_funds_rate', 'unknown')}%, "
        f"real fed funds {s.get('real_fed_funds', 'unknown')}%, "
        f"S&P 500 12-month return {m.get('rolling_12m_return_pct', 'unknown')}%, "
        f"savings rate {s.get('savings_rate', 'unknown')}%"
    )

    score = cortex_sentiment(text)

    if score > 0.6:
        label, color = "optimistic", "green"
    elif score > 0.35:
        label, color = "mixed", "amber"
    else:
        label, color = "cautious", "red"

    result = {"score": round(score, 3), "label": label, "color": color}
    cache_set("sentiment", result, ttl=86400)
    return result


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
async def ask_question(req: AskRequest):
    """Answer a financial education question. Uses llama3.1-8b."""
    cache_key = f"ask:{req.question[:100].lower().strip()}"

    cached = cache_get(cache_key)
    if cached:
        return cached

    prompt = f"You are a financial educator. Answer this question clearly in 3-4 sentences for a beginner: {req.question}"
    answer = cortex_complete("llama3.1-8b", prompt)

    result = {"question": req.question, "answer": answer}
    cache_set(cache_key, result, ttl=3600)
    return result
