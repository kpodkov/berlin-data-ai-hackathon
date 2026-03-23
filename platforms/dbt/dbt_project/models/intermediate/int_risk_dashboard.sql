-- Macro risk dashboard: 4 indicators in tall format (one row per risk_indicator).
-- Grain: one row per risk_indicator — ~4 rows total.
-- Each indicator produces a traffic light (red/yellow/green), a numeric risk_value,
-- and a plain-English action_text for display in a dashboard.
--
-- Indicators:
--   1. Yield Curve Signal   — DGS10 minus FEDFUNDS spread (latest values)
--   2. Market Volatility    — Latest VIX level
--   3. Inflation Momentum   — 3-month annualized CPI vs trailing YoY (acceleration signal)
--   4. Unemployment Trend   — Latest UNRATE vs 6 months ago
{{ config(materialized='table', schema='intermediate') }}

-- ─────────────────────────────────────────────────────────────────────────────
-- Source CTEs: pull the latest N observations for each series used below.
-- All use QUALIFY to avoid subqueries and keep the code flat.
-- ─────────────────────────────────────────────────────────────────────────────

-- DGS10: latest single observation
with dgs10_latest as (
    select value as dgs10_value
    from {{ ref('stg_fred_observations') }}
    where series_id = 'DGS10'
      and value is not null
    qualify row_number() over (order by obs_date desc) = 1
),

-- FEDFUNDS: latest single observation
fedfunds_latest as (
    select value as fedfunds_value
    from {{ ref('stg_fred_observations') }}
    where series_id = 'FEDFUNDS'
      and value is not null
    qualify row_number() over (order by obs_date desc) = 1
),

-- VIXCLS: latest single observation
vix_latest as (
    select value as vix_value
    from {{ ref('stg_fred_observations') }}
    where series_id = 'VIXCLS'
      and value is not null
    qualify row_number() over (order by obs_date desc) = 1
),

-- CPIAUCSL: latest 13 non-null observations (need current, 3m ago, 12m ago).
-- Row 1 = latest, row 4 = ~3 months ago, row 13 = ~12 months ago.
-- Monthly series: each row is one month, so row offsets are exact.
cpi_recent as (
    select
        value,
        row_number() over (order by obs_date desc) as rn
    from {{ ref('stg_fred_observations') }}
    where series_id = 'CPIAUCSL'
      and value is not null
    qualify row_number() over (order by obs_date desc) <= 13
),

-- Pivot the 3 CPI snapshots into a single row for the indicator calculation.
cpi_pivoted as (
    select
        max(case when rn = 1  then value end) as cpi_latest,
        max(case when rn = 4  then value end) as cpi_3m_ago,   -- ~3 months back
        max(case when rn = 13 then value end) as cpi_12m_ago   -- ~12 months back
    from cpi_recent
),

-- UNRATE: latest 7 non-null observations (need current and 6 months ago).
unrate_recent as (
    select
        value,
        row_number() over (order by obs_date desc) as rn
    from {{ ref('stg_fred_observations') }}
    where series_id = 'UNRATE'
      and value is not null
    qualify row_number() over (order by obs_date desc) <= 7
),

-- Pivot UNRATE to current vs 6m ago.
unrate_pivoted as (
    select
        max(case when rn = 1 then value end) as unrate_latest,
        max(case when rn = 7 then value end) as unrate_6m_ago
    from unrate_recent
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicator 1: Yield Curve Signal (DGS10 − FEDFUNDS)
-- Positive spread = normal curve; negative = inverted (historically recessionary).
-- ─────────────────────────────────────────────────────────────────────────────
yield_curve as (
    select
        'Yield Curve Signal'                             as risk_indicator,
        'Interest Rates'                                 as category,
        round(d.dgs10_value - f.fedfunds_value, 2)      as risk_value,
        'percentage points'                              as units,

        case
            when round(d.dgs10_value - f.fedfunds_value, 2) < 0    then 'red'
            when round(d.dgs10_value - f.fedfunds_value, 2) <= 1.0  then 'yellow'
            else 'green'
        end as traffic_light,

        case
            when round(d.dgs10_value - f.fedfunds_value, 2) < 0
                then 'Inverted — historically precedes recession by 12–18 months'
            when round(d.dgs10_value - f.fedfunds_value, 2) <= 1.0
                then 'Flat — monitor for further flattening'
            else 'Normal — no immediate concern'
        end as action_text

    from dgs10_latest d
    cross join fedfunds_latest f
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicator 2: Market Volatility (VIX)
-- VIX < 15: calm; 15–25: normal uncertainty; 25–35: elevated; > 35: fear regime.
-- ─────────────────────────────────────────────────────────────────────────────
market_volatility as (
    select
        'Market Volatility (VIX)'                       as risk_indicator,
        'Financial Markets'                              as category,
        round(vix_value, 2)                             as risk_value,
        'index points'                                  as units,

        case
            when vix_value < 15   then 'green'
            when vix_value < 25   then 'yellow'
            else 'red'
        end as traffic_light,

        case
            when vix_value < 15
                then 'Low volatility — markets are calm'
            when vix_value < 25
                then 'Moderate volatility — normal market uncertainty'
            when vix_value < 35
                then 'Elevated volatility — consider defensive positioning'
            else 'Extreme volatility — high uncertainty, risk-off environment'
        end as action_text

    from vix_latest
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicator 3: Inflation Momentum
-- Compares 3-month annualized CPI growth to trailing 12-month YoY rate.
-- Positive risk_value = inflation accelerating vs trend; negative = decelerating.
-- 3m annualized: (ratio_3m ^ 4 - 1) * 100  [quarterly compounding proxy]
-- Snowflake does not support ^ as power; use POW() instead.
-- ─────────────────────────────────────────────────────────────────────────────

-- Pre-compute intermediate rates to avoid repeating the formula in CASE branches.
cpi_rates as (
    select
        -- 3-month ratio: cpi_latest / cpi_3m_ago
        cpi_latest / nullif(cpi_3m_ago, 0)                                   as ratio_3m,

        -- trailing 12-month YoY % (straight percentage change)
        (cpi_latest - cpi_12m_ago) / nullif(cpi_12m_ago, 0) * 100            as yoy_pct,

        -- 3-month annualized rate: (ratio_3m ^ 4 - 1) * 100
        (pow(cpi_latest / nullif(cpi_3m_ago, 0), 4) - 1) * 100               as annualized_3m_pct

    from cpi_pivoted
),

inflation_momentum as (
    select
        'Inflation Momentum'                                        as risk_indicator,
        'Consumer Prices'                                           as category,

        -- positive = accelerating (recent pace > trend), negative = decelerating
        round(annualized_3m_pct - yoy_pct, 2)                     as risk_value,

        'percentage points'                                         as units,

        case
            when round(annualized_3m_pct - yoy_pct, 2) >  0.5 then 'red'
            when round(annualized_3m_pct - yoy_pct, 2) < -0.5 then 'green'
            else 'yellow'
        end as traffic_light,

        case
            when round(annualized_3m_pct - yoy_pct, 2) >  0.5
                then 'Inflation accelerating — recent pace exceeds trend'
            when round(annualized_3m_pct - yoy_pct, 2) < -0.5
                then 'Inflation decelerating — recent pace below trend'
            else 'Inflation stable — recent pace in line with trend'
        end as action_text

    from cpi_rates
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicator 4: Unemployment Trend
-- Measures change in UNRATE over last 6 months.
-- Rising unemployment signals labour market deterioration.
-- ─────────────────────────────────────────────────────────────────────────────
unemployment_trend as (
    select
        'Unemployment Trend'                                                as risk_indicator,
        'Labour Market'                                                     as category,
        round(unrate_latest - unrate_6m_ago, 2)                           as risk_value,
        'percentage points (6-month change)'                               as units,

        case
            when round(unrate_latest - unrate_6m_ago, 2) > 0.5  then 'red'
            when round(unrate_latest - unrate_6m_ago, 2) > 0.1  then 'yellow'
            else 'green'
        end as traffic_light,

        case
            when round(unrate_latest - unrate_6m_ago, 2) > 0.5
                then 'Unemployment rising sharply — labour market deteriorating'
            when round(unrate_latest - unrate_6m_ago, 2) > 0.1
                then 'Unemployment edging up — watch for continued weakening'
            when round(unrate_latest - unrate_6m_ago, 2) < -0.1
                then 'Unemployment falling — labour market strengthening'
            else 'Unemployment stable — no significant change over 6 months'
        end as action_text

    from unrate_pivoted
),

-- ─────────────────────────────────────────────────────────────────────────────
-- Final assembly: UNION ALL 4 indicators and add urgency_rank + audit column.
-- urgency_rank: red=1, yellow=2, green=3 (sort ascending to surface risks first).
-- ─────────────────────────────────────────────────────────────────────────────
all_indicators as (
    select * from yield_curve
    union all
    select * from market_volatility
    union all
    select * from inflation_momentum
    union all
    select * from unemployment_trend
)

select
    risk_indicator,
    category,
    risk_value,
    units,
    traffic_light,
    action_text,

    case traffic_light
        when 'red'    then 1
        when 'yellow' then 2
        when 'green'  then 3
    end as urgency_rank,

    current_timestamp() as _loaded_at

from all_indicators
order by urgency_rank, risk_indicator
