-- Macro regime indicators for the financial advisor dashboard.
-- Grain: one row per series_id, latest monthly snapshot only.
--
-- Processing pipeline:
--   1. raw_obs          — filter to 9 dashboard series, join metadata
--   2. monthly_norm     — collapse to monthly grain (last value in month)
--                         daily/weekly series: MAX(obs_date) within month
--                         quarterly series:    value as-is (sparse monthly rows)
--   3. with_stats       — rolling 36-month mean, stddev, count; LAG(12) for YoY
--   4. with_zscore      — z-score (null when rolling_count < 12), regime_label,
--                         signal_color, yoy_change_pct
--   5. latest           — keep only the most recent monthly row per series_id
--
-- Signal polarity:
--   Positive growth indicators (GDPC1, PSAVERT, SP500):
--       green  z > +0.5  |  yellow  -0.5..+0.5  |  red    z < -0.5
--   Stress indicators (UNRATE, TDSP, VIXCLS, CPIAUCSL):
--       green  z < -0.5  |  yellow  -0.5..+0.5  |  red    z > +0.5
--   Rate indicators (DGS10, FEDFUNDS): always yellow (neutral / context-only)

{{ config(materialized='table', schema='intermediate') }}

-- ---------------------------------------------------------------------------
-- 1. raw_obs: scope to the 9 dashboard series, attach human-readable metadata
-- ---------------------------------------------------------------------------
with raw_obs as (
    select
        o.series_id,
        o.obs_date,
        o.value,
        m.title,
        m.units,
        m.frequency
    from {{ ref('stg_fred_observations') }} as o
    inner join {{ ref('stg_fred_series_metadata') }} as m
        on o.series_id = m.series_id
    where
        o.series_id in (
            'GDPC1',      -- Real GDP (Quarterly)
            'CPIAUCSL',   -- CPI All Urban Consumers (Monthly)
            'UNRATE',     -- Unemployment Rate (Monthly)
            'FEDFUNDS',   -- Federal Funds Rate (Monthly)
            'DGS10',      -- 10-Year Treasury Yield (Daily)
            'PSAVERT',    -- Personal Saving Rate (Monthly)
            'TDSP',       -- Household Debt Service Ratio (Quarterly)
            'VIXCLS',     -- CBOE VIX (Daily)
            'SP500'       -- S&P 500 Index (Daily)
        )
        and o.value is not null
),

-- ---------------------------------------------------------------------------
-- 2. monthly_norm: normalize every series to a single observation per month.
--
--    Daily / weekly series (DGS10, VIXCLS, SP500, and MORTGAGE30US if present):
--        Pick the row with the latest obs_date within the calendar month.
--        QUALIFY ROW_NUMBER() OVER (PARTITION BY series_id, month_date ORDER BY obs_date DESC) = 1
--
--    Monthly series: already one row per month — obs_date is the 1st; passes through.
--
--    Quarterly series (GDPC1, TDSP):
--        The quarterly observation falls on the first day of the quarter (Jan/Apr/Jul/Oct).
--        We keep that one row per quarter; downstream z-score windows work over sparse
--        monthly dates — this is acceptable because AVG/STDDEV ignore missing months.
--        Forward-fill is intentionally omitted to avoid introducing artificial precision
--        for indicators that are only reported four times per year.
-- ---------------------------------------------------------------------------
monthly_norm as (
    select
        series_id,
        -- Canonical month identifier: first day of the calendar month
        date_trunc('month', obs_date)::date                         as month_date,
        -- Latest raw obs_date within the month (QUALIFY keeps the latest row, so obs_date = max)
        obs_date                                                    as last_obs_date,
        -- Value from the latest observation in the month
        value                                                       as monthly_value,
        title,
        units,
        frequency
    from raw_obs
    qualify
        row_number() over (
            partition by series_id, date_trunc('month', obs_date)
            order by obs_date desc
        ) = 1
),

-- ---------------------------------------------------------------------------
-- 3. with_stats: rolling 36-month stats + 12-month lag for YoY
--
--    Window frame: ROWS BETWEEN 35 PRECEDING AND CURRENT ROW
--    (36 rows total = current + 35 prior monthly observations)
--    Ordered by month_date within each series_id so the window tracks time.
--
--    rolling_count lets downstream logic gate z-scores on data sufficiency.
-- ---------------------------------------------------------------------------
with_stats as (
    select
        series_id,
        month_date,
        last_obs_date,
        monthly_value                                               as value,
        title,
        units,
        frequency,

        -- 12-month lag for year-over-year comparison
        lag(monthly_value, 12) over (
            partition by series_id
            order by month_date
        )                                                           as value_12m_ago,

        -- Rolling 36-month mean
        avg(monthly_value) over (
            partition by series_id
            order by month_date
            rows between 35 preceding and current row
        )                                                           as rolling_mean_36m,

        -- Rolling 36-month standard deviation (sample stddev)
        stddev(monthly_value) over (
            partition by series_id
            order by month_date
            rows between 35 preceding and current row
        )                                                           as rolling_stddev_36m,

        -- Number of non-null observations in the rolling window
        count(monthly_value) over (
            partition by series_id
            order by month_date
            rows between 35 preceding and current row
        )                                                           as rolling_count

    from monthly_norm
),

-- ---------------------------------------------------------------------------
-- 4. with_zscore: derived metrics — z-score, regime_label, signal_color
-- ---------------------------------------------------------------------------
with_zscore as (
    select
        series_id,
        month_date,
        last_obs_date,
        value,
        value_12m_ago,

        -- YoY % change; null when 12m ago is unavailable or zero
        round(
            (value - value_12m_ago) / nullif(value_12m_ago, 0) * 100,
            2
        )                                                           as yoy_change_pct,

        round(rolling_mean_36m, 8)                                  as rolling_mean_36m,
        round(rolling_stddev_36m, 8)                                as rolling_stddev_36m,
        rolling_count,
        title,
        units,
        frequency,

        -- Z-score: only computed when we have at least 12 months of data
        case
            when rolling_count >= 12
                then round(
                    (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                    2
                )
            else null
        end                                                         as z_score,

        -- Regime label driven by z-score thresholds
        case
            when rolling_count < 12                              then 'Insufficient data'
            when rolling_stddev_36m = 0 or rolling_stddev_36m is null
                                                                 then 'Normal'
            when round(
                    (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                    2
                 ) > 1.0                                          then 'Elevated'
            when round(
                    (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                    2
                 ) < -1.0                                         then 'Depressed'
            else                                                       'Normal'
        end                                                         as regime_label,

        -- Signal color for dashboard traffic-light display
        -- Positive growth indicators: high z = good (green), low z = bad (red)
        -- Stress indicators:          high z = bad  (red),  low z = good (green)
        -- Rate indicators:            always neutral (yellow)
        case
            when series_id in ('DGS10', 'FEDFUNDS')
                then 'yellow'

            when series_id in ('GDPC1', 'PSAVERT', 'SP500')
                then case
                    when rolling_count < 12                          then 'yellow'
                    when rolling_stddev_36m = 0 or rolling_stddev_36m is null
                                                                     then 'yellow'
                    when round(
                            (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                            2
                         ) > 0.5                                     then 'green'
                    when round(
                            (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                            2
                         ) < -0.5                                    then 'red'
                    else                                                  'yellow'
                end

            when series_id in ('UNRATE', 'TDSP', 'VIXCLS', 'CPIAUCSL')
                then case
                    when rolling_count < 12                          then 'yellow'
                    when rolling_stddev_36m = 0 or rolling_stddev_36m is null
                                                                     then 'yellow'
                    when round(
                            (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                            2
                         ) < -0.5                                    then 'green'
                    when round(
                            (value - rolling_mean_36m) / nullif(rolling_stddev_36m, 0),
                            2
                         ) > 0.5                                     then 'red'
                    else                                                  'yellow'
                end

            -- Fallback for any unexpected series_id
            else 'yellow'
        end                                                         as signal_color,

        -- Human-readable period label for the latest observation
        to_char(month_date, 'YYYY-MM')                              as as_of_period

    from with_stats
),

-- ---------------------------------------------------------------------------
-- 5. latest: one row per series_id — the most recent monthly snapshot
-- ---------------------------------------------------------------------------
latest as (
    select
        series_id,
        month_date,
        last_obs_date,
        value,
        value_12m_ago,
        yoy_change_pct,
        rolling_mean_36m,
        rolling_stddev_36m,
        rolling_count,
        z_score,
        regime_label,
        signal_color,
        as_of_period,
        title,
        units,
        frequency
    from with_zscore
    qualify
        row_number() over (
            partition by series_id
            order by month_date desc
        ) = 1
)

select * from latest
