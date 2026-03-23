-- Grain: one row per user_id
-- Maps JustWatch behavioral signals to a wealth segment and joins pre-generated
-- financial advice and segment-level intelligence.
-- wealth_tier is derived from financial_score; spending_willingness from tvod_propensity
-- and is_free_only; macro_focus indicates which macro indicators are most relevant.
--
-- Used by: downstream mart / personal finance advisor models

with profiles as (
    select * from {{ ref('stg_user_financial_profiles') }}
),

advice as (
    select * from {{ ref('stg_user_financial_advice') }}
),

segment_intel as (
    select * from {{ ref('stg_segment_intelligence') }}
),

enriched as (
    select
        p.user_id,
        p.segment,
        p.financial_score,

        -- ── Wealth tier ───────────────────────────────────────────────────────────
        case
            when p.financial_score >= 75 then 'Premium'
            when p.financial_score >= 50 then 'Affluent'
            when p.financial_score >= 25 then 'Middle'
            else 'Budget'
        end as wealth_tier,

        -- ── Spending willingness ──────────────────────────────────────────────────
        case
            when p.is_free_only = true then 'Free Only'
            when p.tvod_propensity = 'high' then 'High Spender'
            when p.tvod_propensity = 'medium' then 'Moderate Spender'
            else 'Low Spender'
        end as spending_willingness,

        -- ── Macro focus ───────────────────────────────────────────────────────────
        case
            when p.financial_score >= 50 then 'Market Performance & Rates'
            when p.financial_score >= 25 then 'Inflation & Employment'
            else 'Inflation & Savings'
        end as macro_focus,

        p.tvod_propensity,
        p.svod_tier,
        p.is_cinema_goer,
        p.is_free_only,
        p.engagement_tier,
        p.loyalty_tier,
        p.primary_region,
        p.top_genre_1,

        a.financial_advice,
        s.ai_insight

    from profiles p
    left join advice a on p.user_id = a.user_id
    left join segment_intel s on p.segment = s.segment
)

select
    user_id,
    segment,
    financial_score,
    wealth_tier,
    spending_willingness,
    macro_focus,
    tvod_propensity,
    svod_tier,
    is_cinema_goer,
    is_free_only,
    engagement_tier,
    loyalty_tier,
    primary_region,
    top_genre_1,
    financial_advice,
    ai_insight
from enriched
