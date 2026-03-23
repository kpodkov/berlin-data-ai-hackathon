"""
Snowflake Cortex AI helpers.
All Cortex calls go through Snowflake SQL — no separate API needed.
"""
from api.db import query


def cortex_complete(model: str, prompt: str, max_tokens: int = 1024) -> str:
    """
    Call SNOWFLAKE.CORTEX.COMPLETE() via SQL.
    Models: 'mistral-large2', 'llama3.1-70b', 'llama3.1-8b'
    Returns the generated text string.
    """
    safe_prompt = prompt.replace("'", "''")
    sql = f"SELECT SNOWFLAKE.CORTEX.COMPLETE('{model}', '{safe_prompt}') AS result"
    rows = query(sql)
    if rows and len(rows) > 0:
        return rows[0].get('result', '') or ''
    return ''


def cortex_sentiment(text: str) -> float:
    """
    Call SNOWFLAKE.CORTEX.SENTIMENT() — returns 0-1 score.
    """
    safe_text = text.replace("'", "''")
    sql = f"SELECT SNOWFLAKE.CORTEX.SENTIMENT('{safe_text}') AS result"
    rows = query(sql)
    if rows and len(rows) > 0:
        val = rows[0].get('result')
        return float(val) if val is not None else 0.5
    return 0.5


def cortex_summarize(text: str) -> str:
    """
    Call SNOWFLAKE.CORTEX.SUMMARIZE() — returns condensed text.
    """
    safe_text = text.replace("'", "''")
    sql = f"SELECT SNOWFLAKE.CORTEX.SUMMARIZE('{safe_text}') AS result"
    rows = query(sql)
    if rows and len(rows) > 0:
        return rows[0].get('result', '') or ''
    return ''


def build_action_plan_prompt(
    age: int,
    income: int,
    monthly_investment: int,
    current_savings: int,
    credit_card_debt: int,
    other_debt: int,
    housing_cost: int,
    risk_tolerance: str,
    # Economic context from MARTS
    cpi_yoy: float,
    fed_funds_rate: float,
    mortgage_rate: float,
    credit_card_rate: float,
    savings_rate_national: float,
    spy_return_12m: float,
    median_income: float,
    # EU context (optional)
    eur_usd_rate: float = 0,
    eu_inflation_rate: float = 0,
    ecb_deposit_rate: float = 0,
) -> str:
    """Build the prompt for personalized action plan."""
    eu_context = ""
    if eur_usd_rate > 0:
        eu_context = f"""
EUROPEAN CONTEXT:
- EUR/USD exchange rate: {eur_usd_rate:.4f}
- Euro area HICP inflation: {eu_inflation_rate:.1f}%
- ECB deposit facility rate: {ecb_deposit_rate:.1f}%
"""
    return f"""You are a personal finance advisor for a European-based user. All amounts are in EUR. Based on the user profile and current economic data, provide exactly 3 prioritized wealth-building actions.

USER PROFILE:
- Age: {age}
- Annual income: €{income:,}
- Monthly investment: €{monthly_investment:,}
- Current savings: €{current_savings:,}
- Credit card debt: €{credit_card_debt:,} at {credit_card_rate:.1f}% APR
- Other debt: €{other_debt:,}
- Monthly housing cost: €{housing_cost:,}
- Risk tolerance: {risk_tolerance}

CURRENT ECONOMIC CONDITIONS:
- US CPI inflation: {cpi_yoy:.1f}% YoY
- Fed funds rate: {fed_funds_rate:.1f}%
- 30-year US mortgage rate: {mortgage_rate:.1f}%
- National savings rate: {savings_rate_national:.1f}%
- S&P 500 trailing 12-month return: {spy_return_12m:.1f}%
- Median household income: €{median_income:,.0f}
{eu_context}
Return a JSON array with exactly 3 objects. Each object has:
- "priority": 1, 2, or 3
- "title": short action title (5-8 words)
- "explanation": 2-3 sentences with specific euro amounts. Use € symbol.

Return ONLY the JSON array, no other text. Example format:
[{{"priority":1,"title":"...","explanation":"..."}},{{"priority":2,"title":"...","explanation":"..."}},{{"priority":3,"title":"...","explanation":"..."}}]"""


def build_briefing_prompt(
    cpi_yoy: float,
    food_yoy: float,
    medical_yoy: float,
    rent_yoy: float,
    fed_funds: float,
    mortgage_rate: float,
    spy_return: float,
    savings_rate: float,
) -> str:
    """Build prompt for economic briefing."""
    return f"""You are an economic analyst writing for everyday investors. In exactly 2-3 sentences, summarize the current US economic conditions and what they mean for personal wealth building.

DATA:
- Headline CPI: {cpi_yoy:.1f}% YoY
- Food inflation: {food_yoy:.1f}%
- Medical inflation: {medical_yoy:.1f}%
- Rent inflation: {rent_yoy:.1f}%
- Fed funds rate: {fed_funds:.1f}%
- 30-year mortgage: {mortgage_rate:.1f}%
- S&P 500 12-month return: {spy_return:.1f}%
- National savings rate: {savings_rate:.1f}%

Write in plain English. Include specific numbers. No bullet points — flowing prose only."""


def build_explain_prompt(metric: str, value: float, context: str = '') -> str:
    """Build prompt for contextual metric explanation."""
    return f"""In exactly 2 sentences, explain what it means that {metric} is {value}. {context} Write for someone with no finance background. Be specific and practical."""
