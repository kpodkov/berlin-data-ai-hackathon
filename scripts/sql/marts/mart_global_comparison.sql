USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS MARTS;

CREATE OR REPLACE TABLE MARTS.mart_global_comparison AS
WITH pivoted AS (
    SELECT
        country_code,
        obs_year,
        MAX(CASE WHEN indicator_code = 'NY.GDP.PCAP.PP.CD'  THEN value END) AS gdp_per_capita,
        MAX(CASE WHEN indicator_code = 'FP.CPI.TOTL.ZG'     THEN value END) AS inflation_rate,
        MAX(CASE WHEN indicator_code = 'SL.UEM.TOTL.ZS'     THEN value END) AS unemployment_rate,
        MAX(CASE WHEN indicator_code = 'FR.INR.RINR'         THEN value END) AS real_interest_rate,
        MAX(CASE WHEN indicator_code = 'NY.GNS.ICTR.ZS'     THEN value END) AS savings_rate,
        MAX(CASE WHEN indicator_code = 'SI.POV.GINI'         THEN value END) AS gini_index,
        MAX(CASE WHEN indicator_code = 'SI.DST.10TH.10'     THEN value END) AS income_share_top10,
        MAX(CASE WHEN indicator_code = 'BX.TRF.PWKR.CD.DT'  THEN value END) AS remittances_usd,
        MAX(CASE WHEN indicator_code = 'SP.DYN.LE00.IN'     THEN value END) AS life_expectancy,
        MAX(CASE WHEN indicator_code = 'PA.NUS.PPP'          THEN value END) AS ppp_factor
    FROM DB_TEAM_3.STAGING.stg_worldbank_countries
    WHERE country_code IN ('USA','DEU','GBR','JPN','FRA','CAN','ITA','CHN','IND','BRA','ZAF','KOR','AUS','MEX','NGA')
    GROUP BY country_code, obs_year
),

ranked AS (
    SELECT
        country_code,
        obs_year,
        gdp_per_capita,
        inflation_rate,
        unemployment_rate,
        real_interest_rate,
        savings_rate,
        gini_index,
        income_share_top10,
        remittances_usd,
        life_expectancy,
        ppp_factor,
        -- Higher is better: rank DESC so rank 1 = highest value
        RANK() OVER (PARTITION BY obs_year ORDER BY gdp_per_capita    DESC NULLS LAST) AS rank_gdp_per_capita,
        RANK() OVER (PARTITION BY obs_year ORDER BY life_expectancy    DESC NULLS LAST) AS rank_life_expectancy,
        RANK() OVER (PARTITION BY obs_year ORDER BY savings_rate       DESC NULLS LAST) AS rank_savings_rate,
        -- Lower is better: rank ASC so rank 1 = lowest value
        RANK() OVER (PARTITION BY obs_year ORDER BY inflation_rate     ASC  NULLS LAST) AS rank_inflation_rate,
        RANK() OVER (PARTITION BY obs_year ORDER BY unemployment_rate  ASC  NULLS LAST) AS rank_unemployment_rate,
        RANK() OVER (PARTITION BY obs_year ORDER BY gini_index         ASC  NULLS LAST) AS rank_gini_index
    FROM pivoted
)

SELECT
    r.country_code,
    CASE r.country_code
        WHEN 'USA' THEN 'United States'
        WHEN 'DEU' THEN 'Germany'
        WHEN 'GBR' THEN 'United Kingdom'
        WHEN 'JPN' THEN 'Japan'
        WHEN 'FRA' THEN 'France'
        WHEN 'CAN' THEN 'Canada'
        WHEN 'ITA' THEN 'Italy'
        WHEN 'CHN' THEN 'China'
        WHEN 'IND' THEN 'India'
        WHEN 'BRA' THEN 'Brazil'
        WHEN 'ZAF' THEN 'South Africa'
        WHEN 'KOR' THEN 'South Korea'
        WHEN 'AUS' THEN 'Australia'
        WHEN 'MEX' THEN 'Mexico'
        WHEN 'NGA' THEN 'Nigeria'
    END                                                AS country_name,
    r.obs_year,
    r.gdp_per_capita,
    r.inflation_rate,
    r.unemployment_rate,
    r.real_interest_rate,
    r.savings_rate,
    r.gini_index,
    r.income_share_top10,
    r.life_expectancy,
    r.ppp_factor,
    r.remittances_usd,
    -- US rank columns: value from the USA row for the same year
    usa.rank_gdp_per_capita       AS us_rank_gdp_per_capita,
    usa.rank_life_expectancy      AS us_rank_life_expectancy,
    usa.rank_savings_rate         AS us_rank_savings_rate,
    usa.rank_inflation_rate       AS us_rank_inflation_rate,
    usa.rank_unemployment_rate    AS us_rank_unemployment_rate,
    usa.rank_gini_index           AS us_rank_gini_index
FROM ranked r
LEFT JOIN ranked usa
    ON usa.country_code = 'USA'
    AND usa.obs_year = r.obs_year
ORDER BY r.obs_year, r.country_code;

SELECT
    country_code,
    country_name,
    obs_year,
    gdp_per_capita,
    inflation_rate,
    gini_index
FROM MARTS.mart_global_comparison
WHERE obs_year = 2023
ORDER BY gdp_per_capita DESC NULLS LAST;
