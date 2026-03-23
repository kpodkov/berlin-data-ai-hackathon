USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_savings_health AS
WITH base AS (
    SELECT
        DATE_TRUNC('month', obs_date) AS obs_month,
        series_id,
        value
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id IN ('PSAVERT', 'SAVINGSL', 'FEDFUNDS', 'CPIAUCSL')
      AND value IS NOT NULL
),

-- DGS10 is daily; average down to monthly before pivoting
dgs10_monthly AS (
    SELECT
        DATE_TRUNC('month', obs_date) AS obs_month,
        AVG(value) AS treasury_10y
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id = 'DGS10'
      AND value IS NOT NULL
    GROUP BY 1
),

pivoted AS (
    SELECT
        obs_month,
        MAX(CASE WHEN series_id = 'PSAVERT'  THEN value END) AS savings_rate,
        MAX(CASE WHEN series_id = 'SAVINGSL' THEN value END) AS savings_level,
        MAX(CASE WHEN series_id = 'FEDFUNDS' THEN value END) AS fed_funds_rate,
        MAX(CASE WHEN series_id = 'CPIAUCSL' THEN value END) AS cpi_index
    FROM base
    GROUP BY obs_month
),

joined AS (
    SELECT
        p.obs_month,
        p.savings_rate,
        p.savings_level,
        p.fed_funds_rate,
        d.treasury_10y,
        p.cpi_index
    FROM pivoted p
    LEFT JOIN dgs10_monthly d ON p.obs_month = d.obs_month
),

with_lags AS (
    SELECT
        obs_month,
        savings_rate,
        savings_level,
        fed_funds_rate,
        treasury_10y,
        cpi_index,
        LAG(cpi_index, 12) OVER (ORDER BY obs_month) AS cpi_index_lag12
    FROM joined
    WHERE savings_rate IS NOT NULL
)

SELECT
    obs_month,
    savings_rate,
    savings_level,
    fed_funds_rate,
    treasury_10y,
    cpi_index,
    (cpi_index / NULLIF(cpi_index_lag12, 0)) * 100 - 100                       AS cpi_yoy,
    fed_funds_rate - ((cpi_index / NULLIF(cpi_index_lag12, 0)) * 100 - 100)    AS real_fed_funds,
    treasury_10y  - ((cpi_index / NULLIF(cpi_index_lag12, 0)) * 100 - 100)     AS real_treasury_10y
FROM with_lags
ORDER BY obs_month;

SELECT
    obs_month,
    savings_rate,
    fed_funds_rate,
    cpi_yoy,
    real_fed_funds,
    real_treasury_10y
FROM MARTS.mart_savings_health
WHERE obs_month >= '2020-01-01'
ORDER BY obs_month;
