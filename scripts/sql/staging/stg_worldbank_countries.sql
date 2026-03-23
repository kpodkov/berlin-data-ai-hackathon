USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;

CREATE SCHEMA IF NOT EXISTS STAGING;

CREATE OR REPLACE VIEW STAGING.stg_worldbank_countries AS
SELECT
    LEFT(o.series_id, LENGTH(o.series_id) - 4)  AS indicator_code,
    CASE LEFT(o.series_id, LENGTH(o.series_id) - 4)
        WHEN 'NY.GDP.PCAP.PP.CD' THEN 'GDP per Capita'
        WHEN 'FP.CPI.TOTL.ZG'   THEN 'Inflation Rate'
        WHEN 'SL.UEM.TOTL.ZS'   THEN 'Unemployment'
        WHEN 'FR.INR.RINR'       THEN 'Real Interest Rate'
        WHEN 'NY.GNS.ICTR.ZS'   THEN 'Savings Rate'
        WHEN 'SI.POV.GINI'       THEN 'Gini Index'
        WHEN 'SI.DST.10TH.10'   THEN 'Income Share Top 10'
        WHEN 'BX.TRF.PWKR.CD.DT' THEN 'Remittances'
        WHEN 'SP.DYN.LE00.IN'   THEN 'Life Expectancy'
        WHEN 'PA.NUS.PPP'        THEN 'PPP Factor'
        ELSE NULL
    END                                          AS indicator_name,
    RIGHT(o.series_id, 3)                        AS country_code,
    o.obs_date,
    YEAR(o.obs_date)                             AS obs_year,
    o.value,
    m.title
FROM DB_TEAM_3.RAW.WORLDBANK_INDICATORS AS o
LEFT JOIN DB_TEAM_3.RAW.WORLDBANK_METADATA AS m
    ON o.series_id = m.series_id;

SELECT
    indicator_name,
    COUNT(DISTINCT country_code) AS countries,
    COUNT(*)                     AS row_count
FROM STAGING.stg_worldbank_countries
GROUP BY 1
ORDER BY 1;
