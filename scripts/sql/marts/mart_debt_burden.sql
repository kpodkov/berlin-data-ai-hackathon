-- mart_debt_burden.sql
-- Grain: one row per calendar month
-- Covers U.S. household debt burden indicators sourced from FRED via stg_fred_timeseries.
--
-- Series used:
--   MORTGAGE30US   - 30-Year Fixed Mortgage Rate (weekly → monthly avg)
--   TERMCBCCALLNS  - Credit Card Interest Rate    (monthly)
--   FEDFUNDS       - Federal Funds Rate            (monthly)
--   TOTALSL        - Total Consumer Credit         (monthly, millions USD)
--   REVOLSL        - Revolving Consumer Credit     (monthly, millions USD)
--   NONREVSL       - Non-Revolving Consumer Credit (monthly, millions USD)
--   TDSP           - Household Debt Service Ratio  (quarterly → forward-filled to monthly)

USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_debt_burden AS

WITH

-- ── 1. Monthly spine: all months covered by any series ───────────────────────
monthly_spine AS (
    SELECT DISTINCT DATE_TRUNC('month', obs_date)::DATE AS obs_month
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id IN (
        'MORTGAGE30US', 'TERMCBCCALLNS', 'FEDFUNDS',
        'TOTALSL', 'REVOLSL', 'NONREVSL', 'TDSP'
    )
),

-- ── 2. Mortgage rate: weekly → monthly average ────────────────────────────────
mortgage_monthly AS (
    SELECT
        DATE_TRUNC('month', obs_date)::DATE AS obs_month,
        AVG(value::FLOAT)                   AS mortgage_rate
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id = 'MORTGAGE30US'
      AND value IS NOT NULL
    GROUP BY 1
),

-- ── 3. Monthly series: direct pivot ──────────────────────────────────────────
monthly_series AS (
    SELECT
        DATE_TRUNC('month', obs_date)::DATE                              AS obs_month,
        MAX(CASE WHEN series_id = 'TERMCBCCALLNS' THEN value::FLOAT END) AS credit_card_rate,
        MAX(CASE WHEN series_id = 'FEDFUNDS'      THEN value::FLOAT END) AS fed_funds_rate,
        MAX(CASE WHEN series_id = 'TOTALSL'       THEN value::FLOAT END) AS total_credit,
        MAX(CASE WHEN series_id = 'REVOLSL'       THEN value::FLOAT END) AS revolving_credit,
        MAX(CASE WHEN series_id = 'NONREVSL'      THEN value::FLOAT END) AS nonrevolving_credit
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id IN ('TERMCBCCALLNS', 'FEDFUNDS', 'TOTALSL', 'REVOLSL', 'NONREVSL')
      AND value IS NOT NULL
    GROUP BY 1
),

-- ── 4. TDSP: quarterly obs → forward-fill to monthly ─────────────────────────
-- Each quarterly point (obs_date = first day of quarter) is carried forward
-- until the next quarterly observation arrives.
tdsp_quarterly AS (
    SELECT
        obs_date::DATE AS obs_month,   -- already first-of-quarter
        value::FLOAT   AS debt_service_ratio
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id = 'TDSP'
      AND value IS NOT NULL
),

-- For every spine month, find the most recent quarterly obs on or before it.
tdsp_filled AS (
    SELECT
        s.obs_month,
        MAX(t.obs_month) AS last_quarterly_date
    FROM monthly_spine s
    LEFT JOIN tdsp_quarterly t
        ON t.obs_month <= s.obs_month
    GROUP BY s.obs_month
),

tdsp_monthly AS (
    SELECT
        f.obs_month,
        t.debt_service_ratio
    FROM tdsp_filled f
    LEFT JOIN tdsp_quarterly t
        ON t.obs_month = f.last_quarterly_date
),

-- ── 5. Assemble mart ─────────────────────────────────────────────────────────
assembled AS (
    SELECT
        sp.obs_month,
        mo.mortgage_rate,
        ms.credit_card_rate,
        ms.fed_funds_rate,
        ms.total_credit,
        ms.revolving_credit,
        ms.nonrevolving_credit,
        td.debt_service_ratio
    FROM monthly_spine sp
    LEFT JOIN mortgage_monthly mo  ON mo.obs_month = sp.obs_month
    LEFT JOIN monthly_series   ms  ON ms.obs_month = sp.obs_month
    LEFT JOIN tdsp_monthly     td  ON td.obs_month = sp.obs_month
)

-- ── 6. Derived metrics ───────────────────────────────────────────────────────
SELECT
    obs_month,
    mortgage_rate,
    credit_card_rate,
    fed_funds_rate,
    total_credit,
    revolving_credit,
    nonrevolving_credit,
    debt_service_ratio,

    -- Spread between credit card rate and fed funds rate (percentage points)
    credit_card_rate - fed_funds_rate                           AS credit_card_spread,

    -- Revolving credit as share of total consumer credit (percent)
    revolving_credit / NULLIF(total_credit, 0) * 100           AS revolving_pct_of_total,

    -- Year-over-year percentage change in total consumer credit
    (total_credit
        - LAG(total_credit, 12) OVER (ORDER BY obs_month))
    / NULLIF(LAG(total_credit, 12) OVER (ORDER BY obs_month), 0) * 100
                                                                AS total_credit_yoy

FROM assembled
ORDER BY obs_month
;
