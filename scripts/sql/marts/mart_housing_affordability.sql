USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_housing_affordability AS

WITH

-- Monthly averages / point values per series (collapse weekly → monthly via AVG)
monthly_raw AS (
    SELECT
        DATE_TRUNC('MONTH', obs_date) AS obs_month,
        AVG(CASE WHEN series_id = 'MSPUS'            THEN value END) AS median_home_price_raw,
        AVG(CASE WHEN series_id = 'CSUSHPISA'        THEN value END) AS home_price_index_raw,
        AVG(CASE WHEN series_id = 'MORTGAGE30US'     THEN value END) AS mortgage_rate_raw,
        AVG(CASE WHEN series_id = 'CUSR0000SEHA'     THEN value END) AS rent_index_raw,
        AVG(CASE WHEN series_id = 'HOUST'            THEN value END) AS housing_starts_raw,
        AVG(CASE WHEN series_id = 'FIXHAI'           THEN value END) AS affordability_index_raw,
        AVG(CASE WHEN series_id = 'MEHOINUSA672N'    THEN value END) AS median_income_annual_raw
    FROM DB_TEAM_3.STAGING.stg_fred_timeseries
    WHERE series_id IN (
        'MSPUS', 'CSUSHPISA', 'MORTGAGE30US',
        'CUSR0000SEHA', 'HOUST', 'FIXHAI', 'MEHOINUSA672N'
    )
    GROUP BY 1
),

-- Build a complete monthly spine from earliest to latest month in the data
spine AS (
    SELECT DATEADD('MONTH', seq.idx, min_month.mn) AS obs_month
    FROM (
        SELECT MIN(obs_month) AS mn, MAX(obs_month) AS mx
        FROM monthly_raw
    ) min_month,
    (
        SELECT ROW_NUMBER() OVER (ORDER BY SEQ4()) - 1 AS idx
        FROM TABLE(GENERATOR(ROWCOUNT => 2000))
    ) seq
    WHERE DATEADD('MONTH', seq.idx, min_month.mn) <= min_month.mx
),

-- Left-join raw monthly values onto the spine (introduces NULLs for sparse series)
spine_joined AS (
    SELECT
        s.obs_month,
        r.median_home_price_raw,
        r.home_price_index_raw,
        r.mortgage_rate_raw,
        r.rent_index_raw,
        r.housing_starts_raw,
        r.affordability_index_raw,
        r.median_income_annual_raw
    FROM spine s
    LEFT JOIN monthly_raw r ON r.obs_month = s.obs_month
),

-- Forward-fill sparse series (quarterly MSPUS, annual MEHOINUSA672N, etc.)
filled AS (
    SELECT
        obs_month,
        LAST_VALUE(median_home_price_raw   IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS median_home_price,
        LAST_VALUE(home_price_index_raw    IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS home_price_index,
        LAST_VALUE(mortgage_rate_raw       IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS mortgage_rate,
        LAST_VALUE(rent_index_raw          IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rent_index,
        LAST_VALUE(housing_starts_raw      IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS housing_starts,
        LAST_VALUE(affordability_index_raw IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS affordability_index,
        LAST_VALUE(median_income_annual_raw IGNORE NULLS) OVER (
            ORDER BY obs_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS median_income_annual
    FROM spine_joined
),

-- Compute derived affordability metrics
computed AS (
    SELECT
        obs_month,
        median_home_price,
        home_price_index,
        mortgage_rate,
        rent_index,
        housing_starts,
        affordability_index,
        median_income_annual,

        -- 30-year amortization on 80% LTV
        -- P = principal, r = monthly rate, n = 360 months
        -- payment = P * r * (1+r)^n / ((1+r)^n - 1)
        CASE
            WHEN median_home_price IS NOT NULL
             AND mortgage_rate     IS NOT NULL
             AND mortgage_rate > 0
            THEN
                ROUND(
                    (median_home_price * 0.8)
                    * (mortgage_rate / 100.0 / 12.0)
                    * POWER(1.0 + mortgage_rate / 100.0 / 12.0, 360)
                    / (POWER(1.0 + mortgage_rate / 100.0 / 12.0, 360) - 1.0),
                    2
                )
        END AS monthly_mortgage_payment,

        -- Price-to-income ratio
        CASE
            WHEN median_home_price   IS NOT NULL
             AND median_income_annual IS NOT NULL
             AND median_income_annual > 0
            THEN ROUND(median_home_price / median_income_annual, 4)
        END AS home_price_to_income_ratio,

        -- YoY rent change (computed in next CTE after lag is available)
        rent_index AS rent_index_for_yoy

    FROM filled
),

-- Year-over-year rent change requires a 12-month lag
final AS (
    SELECT
        obs_month,
        median_home_price,
        home_price_index,
        mortgage_rate,
        rent_index,
        housing_starts,
        affordability_index,
        median_income_annual,
        monthly_mortgage_payment,
        home_price_to_income_ratio,

        -- mortgage payment as % of monthly income
        CASE
            WHEN monthly_mortgage_payment IS NOT NULL
             AND median_income_annual     IS NOT NULL
             AND median_income_annual > 0
            THEN ROUND(monthly_mortgage_payment / (median_income_annual / 12.0) * 100.0, 2)
        END AS mortgage_pct_of_income,

        -- YoY pct change in rent index
        CASE
            WHEN rent_index_for_yoy IS NOT NULL
             AND LAG(rent_index_for_yoy, 12) OVER (ORDER BY obs_month) IS NOT NULL
             AND LAG(rent_index_for_yoy, 12) OVER (ORDER BY obs_month) > 0
            THEN ROUND(
                    (rent_index_for_yoy
                     - LAG(rent_index_for_yoy, 12) OVER (ORDER BY obs_month))
                    / LAG(rent_index_for_yoy, 12) OVER (ORDER BY obs_month)
                    * 100.0,
                    2
                )
        END AS rent_yoy

    FROM computed
)

SELECT * FROM final
ORDER BY obs_month;
