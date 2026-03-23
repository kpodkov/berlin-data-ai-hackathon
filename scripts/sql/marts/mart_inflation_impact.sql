USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_inflation_impact AS
WITH base AS (
    SELECT
        DATE_TRUNC('month', obs_date) AS obs_month,
        series_id,
        value
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE topic IN ('cpi', 'housing')
      AND series_id IN (
          'CPIAUCSL',
          'CPIUFDSL',
          'CPIENGSL',
          'CPIMEDSL',
          'CUSR0000SAE1',
          'CUUR0000SAT1',
          'CUSR0000SEHA'
      )
      AND value IS NOT NULL
),

pivoted AS (
    SELECT
        obs_month,
        MAX(CASE WHEN series_id = 'CPIAUCSL'     THEN value END) AS cpi_all,
        MAX(CASE WHEN series_id = 'CPIUFDSL'     THEN value END) AS cpi_food,
        MAX(CASE WHEN series_id = 'CPIENGSL'     THEN value END) AS cpi_energy,
        MAX(CASE WHEN series_id = 'CPIMEDSL'     THEN value END) AS cpi_medical,
        MAX(CASE WHEN series_id = 'CUSR0000SAE1' THEN value END) AS cpi_education,
        MAX(CASE WHEN series_id = 'CUUR0000SAT1' THEN value END) AS cpi_transportation,
        MAX(CASE WHEN series_id = 'CUSR0000SEHA' THEN value END) AS cpi_rent
    FROM base
    GROUP BY obs_month
),

with_lags AS (
    SELECT
        obs_month,
        cpi_all,
        cpi_food,
        cpi_energy,
        cpi_medical,
        cpi_education,
        cpi_transportation,
        cpi_rent,
        LAG(cpi_all,          12) OVER (ORDER BY obs_month) AS cpi_all_lag,
        LAG(cpi_food,         12) OVER (ORDER BY obs_month) AS cpi_food_lag,
        LAG(cpi_energy,       12) OVER (ORDER BY obs_month) AS cpi_energy_lag,
        LAG(cpi_medical,      12) OVER (ORDER BY obs_month) AS cpi_medical_lag,
        LAG(cpi_education,    12) OVER (ORDER BY obs_month) AS cpi_education_lag,
        LAG(cpi_transportation, 12) OVER (ORDER BY obs_month) AS cpi_transportation_lag,
        LAG(cpi_rent,         12) OVER (ORDER BY obs_month) AS cpi_rent_lag,
        FIRST_VALUE(cpi_all) OVER (ORDER BY obs_month) AS cpi_all_base
    FROM pivoted
    WHERE cpi_all IS NOT NULL
)

SELECT
    obs_month,
    cpi_all,
    cpi_food,
    cpi_energy,
    cpi_medical,
    cpi_education,
    cpi_transportation,
    cpi_rent,
    (cpi_all          / NULLIF(cpi_all_lag,          0) - 1) * 100 AS cpi_all_yoy,
    (cpi_food         / NULLIF(cpi_food_lag,         0) - 1) * 100 AS cpi_food_yoy,
    (cpi_energy       / NULLIF(cpi_energy_lag,       0) - 1) * 100 AS cpi_energy_yoy,
    (cpi_medical      / NULLIF(cpi_medical_lag,      0) - 1) * 100 AS cpi_medical_yoy,
    (cpi_education    / NULLIF(cpi_education_lag,    0) - 1) * 100 AS cpi_education_yoy,
    (cpi_transportation / NULLIF(cpi_transportation_lag, 0) - 1) * 100 AS cpi_transportation_yoy,
    (cpi_rent         / NULLIF(cpi_rent_lag,         0) - 1) * 100 AS cpi_rent_yoy,
    100.0 * cpi_all_base / NULLIF(cpi_all, 0)                       AS purchasing_power_index
FROM with_lags
ORDER BY obs_month;

SELECT
    obs_month,
    cpi_all_yoy,
    cpi_food_yoy,
    cpi_energy_yoy,
    purchasing_power_index
FROM MARTS.mart_inflation_impact
WHERE obs_month >= '2023-01-01'
ORDER BY obs_month;
