-- Monthly time series for 9 key FRED macro indicators, enriched with metadata and YoY change.
-- Grain: one row per (series_id, month_date) — full history, not just latest.
-- For each calendar month only the last observation within that month is kept (handles
-- daily/weekly series that have multiple observations in a month, e.g. VIXCLS, SP500, DGS10).
-- YoY change is computed via LAG(12) over the monthly spine per series.
{{ config(materialized='table', schema='intermediate') }}

with observations as (
    select
        series_id,
        obs_date,
        value
    from {{ ref('stg_fred_observations') }}
    where series_id in (
        'GDPC1',    -- Real GDP (quarterly)
        'CPIAUCSL', -- CPI All Urban Consumers (monthly)
        'UNRATE',   -- Unemployment Rate (monthly)
        'FEDFUNDS', -- Federal Funds Rate (monthly)
        'DGS10',    -- 10-Year Treasury Yield (daily → monthly)
        'PSAVERT',  -- Personal Saving Rate (monthly)
        'TDSP',     -- Total Debt Service Ratio (quarterly)
        'VIXCLS',   -- CBOE VIX (daily → monthly)
        'SP500'     -- S&P 500 Index (daily → monthly)
    )
),

-- Collapse to monthly grain: keep the last observation within each calendar month per series.
-- This normalises daily/weekly series (DGS10, VIXCLS, SP500) to the same monthly spine as
-- monthly/quarterly series, enabling consistent YoY lag computation across all 9 series.
monthly as (
    select
        series_id,
        date_trunc('month', obs_date)::date as month_date,
        value
    from observations
    qualify row_number() over (
        partition by series_id, date_trunc('month', obs_date)
        order by obs_date desc
    ) = 1
),

-- Join metadata once on the de-duplicated set of series_ids before expanding to all months.
metadata as (
    select
        series_id,
        title,
        units,
        frequency,
        seasonal_adjustment,
        category
    from {{ ref('stg_fred_series_metadata') }}
    where series_id in (
        'GDPC1', 'CPIAUCSL', 'UNRATE', 'FEDFUNDS',
        'DGS10', 'PSAVERT', 'TDSP', 'VIXCLS', 'SP500'
    )
),

-- Enrich monthly observations with metadata and compute YoY metrics.
enriched as (
    select
        -- identity
        m.series_id,
        md.title,
        md.units,
        md.frequency,
        md.seasonal_adjustment,
        md.category,

        -- time dimension
        m.month_date,

        -- value
        m.value,

        -- 12-month lagged value for YoY calculation
        lag(m.value, 12) over (
            partition by m.series_id
            order by m.month_date
        ) as value_12m_ago,

        -- YoY % change: NULL when either leg is NULL (first 12 months of history, or gaps)
        round(
            (m.value - lag(m.value, 12) over (
                partition by m.series_id order by m.month_date
            ))
            / nullif(lag(m.value, 12) over (
                partition by m.series_id order by m.month_date
            ), 0) * 100,
            2
        ) as yoy_change_pct

    from monthly m
    inner join metadata md on m.series_id = md.series_id
)

select
    series_id,
    title,
    units,
    frequency,
    seasonal_adjustment,
    category,
    month_date,
    value,
    value_12m_ago,
    yoy_change_pct
from enriched
order by series_id, month_date
