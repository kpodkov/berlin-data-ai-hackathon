USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_investment_performance AS

-- Monthly close: last trading-day price per ticker-month
WITH monthly_close AS (
    SELECT
        series_id,
        title,
        asset_class,
        month_key,
        LAST_VALUE(value) OVER (
            PARTITION BY series_id, month_key
            ORDER BY obs_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS monthly_close,
        ROW_NUMBER() OVER (
            PARTITION BY series_id, month_key
            ORDER BY obs_date DESC
        ) AS rn
    FROM DB_TEAM_3.STAGING.stg_market_returns
    WHERE value IS NOT NULL
),

-- Deduplicate to one row per ticker-month (the last trading day)
monthly_close_deduped AS (
    SELECT
        series_id,
        title,
        asset_class,
        month_key,
        monthly_close
    FROM monthly_close
    WHERE rn = 1
),

-- Raw monthly return: (this month close / last month close) - 1
with_monthly_return AS (
    SELECT
        series_id,
        title,
        asset_class,
        month_key,
        monthly_close,
        (monthly_close
            / NULLIF(
                LAG(monthly_close) OVER (PARTITION BY series_id ORDER BY month_key),
                0
              )
        ) - 1 AS monthly_return
    FROM monthly_close_deduped
),

-- CPI: one value per month from FRED (CPIAUCSL is monthly, obs_date = 1st of month)
cpi_monthly AS (
    SELECT
        DATE_TRUNC('MONTH', obs_date) AS month_key,
        MAX(value) AS cpi
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id = 'CPIAUCSL'
      AND value IS NOT NULL
    GROUP BY 1
),

-- MoM inflation from CPI
cpi_with_inflation AS (
    SELECT
        month_key,
        cpi,
        (cpi / NULLIF(LAG(cpi) OVER (ORDER BY month_key), 0)) - 1 AS monthly_inflation
    FROM cpi_monthly
),

-- VIX: average daily close per calendar month
vix_monthly AS (
    SELECT
        DATE_TRUNC('MONTH', obs_date) AS month_key,
        AVG(value) AS vix_monthly_avg
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id = 'VIXCLS'
      AND value IS NOT NULL
    GROUP BY 1
),

-- Join market returns with CPI inflation and VIX
joined AS (
    SELECT
        r.series_id,
        r.title,
        r.asset_class,
        r.month_key,
        r.monthly_close,
        r.monthly_return,
        r.monthly_return - COALESCE(c.monthly_inflation, 0) AS real_monthly_return,
        v.vix_monthly_avg
    FROM with_monthly_return r
    LEFT JOIN cpi_with_inflation c ON r.month_key = c.month_key
    LEFT JOIN vix_monthly v       ON r.month_key = v.month_key
),

-- Cumulative returns and drawdown metrics
with_cumulative AS (
    SELECT
        series_id,
        title,
        asset_class,
        month_key,
        monthly_close,
        monthly_return,
        real_monthly_return,
        vix_monthly_avg,

        -- Compounded cumulative return (geometric, handles negatives gracefully)
        EXP(
            SUM(LN(NULLIF(1 + monthly_return, 0)))
            OVER (PARTITION BY series_id ORDER BY month_key)
        ) - 1 AS cumulative_return,

        -- Compounded cumulative real return
        EXP(
            SUM(LN(NULLIF(1 + real_monthly_return, 0)))
            OVER (PARTITION BY series_id ORDER BY month_key)
        ) - 1 AS cumulative_real_return,

        -- Rolling 12-month compounded return
        EXP(
            SUM(LN(NULLIF(1 + monthly_return, 0)))
            OVER (
                PARTITION BY series_id
                ORDER BY month_key
                ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
            )
        ) - 1 AS rolling_12m_return
    FROM joined
)

SELECT
    series_id,
    title,
    asset_class,
    month_key,
    monthly_close,
    monthly_return,
    real_monthly_return,

    cumulative_return,
    cumulative_real_return,

    -- Running peak of cumulative return (for drawdown denominator)
    MAX(1 + cumulative_return)
        OVER (PARTITION BY series_id ORDER BY month_key) AS running_max,

    -- Drawdown: how far below the all-time peak (always <= 0)
    ((1 + cumulative_return)
        / NULLIF(
            MAX(1 + cumulative_return)
                OVER (PARTITION BY series_id ORDER BY month_key),
            0
          )
    ) - 1 AS drawdown,

    rolling_12m_return,
    vix_monthly_avg
FROM with_cumulative
ORDER BY series_id, month_key;


-- Verification query
SELECT
    series_id,
    month_key,
    monthly_return,
    cumulative_return,
    drawdown
FROM MARTS.mart_investment_performance
WHERE series_id = 'SPY'
  AND month_key >= '2020-01-01'
ORDER BY month_key
LIMIT 20;
