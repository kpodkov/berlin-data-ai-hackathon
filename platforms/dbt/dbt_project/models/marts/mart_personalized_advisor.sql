-- Grain: one row per (user_id, macro_series_id).
-- Each user is matched to the 3 FRED macro indicators most relevant to their
-- wealth tier's macro_focus.  The CROSS JOIN produces every user × every
-- indicator combination; the WHERE clause retains only the 3 relevant ones.
--
-- personalized_action is a plain-English recommendation derived from the
-- user's wealth_tier and the signal_color of each matched indicator.
--
-- Sources:
--   int_user_wealth_proxy  — behavioral wealth proxy, one row per user
--   fct_market_environment — macro regime snapshot, one row per FRED series

{{ config(materialized='table', schema='marts') }}

with

wealth as (
    select * from {{ ref('int_user_wealth_proxy') }}
),

macro as (
    select * from {{ ref('fct_market_environment') }}
),

combined as (
    select
        u.user_id,
        u.segment,
        u.wealth_tier,
        u.spending_willingness,
        u.macro_focus,
        u.financial_score,
        u.financial_advice,
        u.ai_insight,

        env.series_id                                               as macro_series_id,
        env.indicator_name                                          as macro_title,
        env.signal_color                                            as macro_signal_color,
        env.regime_label,
        env.latest_value                                            as macro_value,
        env.as_of_period,

        case
            when u.wealth_tier = 'Premium' and env.signal_color = 'red'
                then 'Consider defensive positioning — elevated volatility or falling markets detected'
            when u.wealth_tier = 'Premium' and env.signal_color = 'green'
                then 'Strong macro conditions — consider equity exposure'
            when u.wealth_tier = 'Affluent' and env.signal_color = 'red'
                then 'Review portfolio risk — inflation or rate pressures elevated'
            when u.wealth_tier = 'Affluent' and env.signal_color = 'green'
                then 'Macro conditions supportive — stay invested'
            when u.wealth_tier = 'Middle' and env.signal_color = 'red'
                then 'Inflation risk elevated — prioritise savings rate and debt reduction'
            when u.wealth_tier = 'Middle' and env.signal_color = 'green'
                then 'Stable economic conditions — good time to build emergency fund'
            when u.wealth_tier = 'Budget' and env.signal_color = 'red'
                then 'Cost-of-living pressure high — focus on free/AVOD content and essential spending only'
            when u.wealth_tier = 'Budget' and env.signal_color = 'green'
                then 'Inflation stabilising — small savings opportunities available'
            else 'Monitor macro conditions — mixed signals'
        end                                                         as personalized_action,

        current_timestamp()                                         as _loaded_at

    from wealth as u
    cross join macro as env
    where
        (
            u.macro_focus = 'Market Performance & Rates'
            and env.series_id in ('SP500', 'DGS10', 'FEDFUNDS')
        )
        or (
            u.macro_focus = 'Inflation & Employment'
            and env.series_id in ('CPIAUCSL', 'UNRATE', 'GDPC1')
        )
        or (
            u.macro_focus = 'Inflation & Savings'
            and env.series_id in ('CPIAUCSL', 'PSAVERT', 'UNRATE')
        )
)

select
    user_id,
    segment,
    wealth_tier,
    spending_willingness,
    macro_focus,
    financial_score,
    macro_series_id,
    macro_title,
    macro_signal_color,
    regime_label,
    macro_value,
    as_of_period,
    personalized_action,
    financial_advice,
    ai_insight,
    _loaded_at
from combined
