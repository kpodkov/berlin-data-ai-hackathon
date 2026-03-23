"""POST /api/cortex/action-plan — personalized wealth-building actions via Cortex AI."""

import hashlib
import json as json_lib

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.cache import cache_get, cache_set
from api.cortex import build_action_plan_prompt, cortex_complete
from api.db import query

router = APIRouter(prefix="/api/cortex", tags=["cortex"])


class ActionPlanRequest(BaseModel):
    age: int
    income: float
    monthlyInvestment: float
    currentSavings: float = 0
    creditCardDebt: float = 0
    otherDebt: float = 0
    housingCost: float = 0
    riskTolerance: str = "moderate"


@router.post("/action-plan")
async def get_action_plan(req: ActionPlanRequest):
    """
    Generate 3 personalized wealth-building actions using Cortex AI.
    Combines user profile with live MARTS economic data.
    """
    # 1. Check cache — key is a deterministic hash of the request body
    cache_key = "action_plan:" + hashlib.md5(
        json_lib.dumps(req.dict(), sort_keys=True).encode()
    ).hexdigest()

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    # 2. Fetch latest economic context from MARTS
    try:
        inflation = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_INFLATION_IMPACT ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        debt = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_DEBT_BURDEN ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        savings = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_SAVINGS_HEALTH ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        investment = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_INVESTMENT_PERFORMANCE WHERE SERIES_ID = 'SPY' ORDER BY MONTH_KEY DESC LIMIT 1"
        )
        housing = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_HOUSING_AFFORDABILITY ORDER BY OBS_MONTH DESC LIMIT 1"
        )
        eur_usd = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_CURRENCY_ENVIRONMENT WHERE SERIES_ID = 'ECB_EXR_USD' ORDER BY MONTH_DATE DESC LIMIT 1"
        )
        eu_inflation = query(
            "SELECT * FROM DB_TEAM_3.MARTS.MART_CURRENCY_ENVIRONMENT WHERE SERIES_ID = 'ECB_HICP_U2' ORDER BY MONTH_DATE DESC LIMIT 1"
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # 3. Extract values — keys are lowercase (db.query normalises them)
    i = inflation[0] if inflation else {}
    d = debt[0] if debt else {}
    s = savings[0] if savings else {}
    m = investment[0] if investment else {}
    h = housing[0] if housing else {}
    fx = eur_usd[0] if eur_usd else {}
    eu = eu_inflation[0] if eu_inflation else {}

    # 4. Build prompt with user profile + economic context
    prompt = build_action_plan_prompt(
        age=req.age,
        income=int(req.income),
        monthly_investment=int(req.monthlyInvestment),
        current_savings=int(req.currentSavings),
        credit_card_debt=int(req.creditCardDebt),
        other_debt=int(req.otherDebt),
        housing_cost=int(req.housingCost),
        risk_tolerance=req.riskTolerance,
        cpi_yoy=float(i.get("cpi_all_yoy") or 0),
        fed_funds_rate=float(d.get("fed_funds_rate") or 0),
        mortgage_rate=float(d.get("mortgage_rate") or 0),
        credit_card_rate=float(d.get("credit_card_rate") or 0),
        savings_rate_national=float(s.get("savings_rate") or 0),
        spy_return_12m=float(m.get("rolling_12m_return_pct") or 0),
        median_income=float(h.get("median_income_annual") or 75000),
        eur_usd_rate=float(fx.get("value") or 0),
        eu_inflation_rate=float(eu.get("value") or 0),
        ecb_deposit_rate=float(eu.get("ecb_deposit_rate") or 0) if "ecb_deposit_rate" in eu else 0,
    )

    # 5. Call Cortex
    try:
        raw = cortex_complete("mistral-large2", prompt)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # 6. Parse JSON response — find the array even if Cortex adds surrounding text
    actions = []
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            actions = json_lib.loads(raw[start:end])
    except Exception:
        pass

    if not actions:
        # Fallback: surface raw text as a single action so the response is always useful
        actions = [
            {
                "priority": 1,
                "title": "AI Recommendation",
                "explanation": raw or "Unable to generate recommendations at this time.",
            }
        ]

    result = {
        "actions": actions,
        "disclaimer": "For educational purposes only. Consult a qualified financial advisor.",
    }

    # 7. Cache for 5 minutes — Cortex calls are expensive
    cache_set(cache_key, result, ttl=300)

    return result
