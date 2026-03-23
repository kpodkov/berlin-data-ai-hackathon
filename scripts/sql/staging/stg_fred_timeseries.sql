USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;

CREATE SCHEMA IF NOT EXISTS STAGING;

CREATE OR REPLACE VIEW STAGING.stg_fred_timeseries AS
SELECT
    o.series_id,
    o.obs_date,
    o.value,
    m.title,
    m.units,
    m.frequency,
    CASE o.series_id
        WHEN 'PI'             THEN 'income'
        WHEN 'CES0500000003'  THEN 'income'
        WHEN 'MEHOINUSA672N'  THEN 'income'
        WHEN 'A229RX0'        THEN 'income'
        WHEN 'PSAVERT'        THEN 'savings'
        WHEN 'SAVINGSL'       THEN 'savings'
        WHEN 'MORTGAGE30US'   THEN 'debt'
        WHEN 'TERMCBCCALLNS'  THEN 'debt'
        WHEN 'TOTALSL'        THEN 'debt'
        WHEN 'REVOLSL'        THEN 'debt'
        WHEN 'NONREVSL'       THEN 'debt'
        WHEN 'TDSP'           THEN 'debt'
        WHEN 'CSUSHPISA'      THEN 'housing'
        WHEN 'MSPUS'          THEN 'housing'
        WHEN 'FIXHAI'         THEN 'housing'
        WHEN 'CUSR0000SEHA'   THEN 'housing'
        WHEN 'HOUST'          THEN 'housing'
        WHEN 'CPIAUCSL'       THEN 'cpi'
        WHEN 'CPIUFDSL'       THEN 'cpi'
        WHEN 'CPIENGSL'       THEN 'cpi'
        WHEN 'CPIMEDSL'       THEN 'cpi'
        WHEN 'CUSR0000SAE1'   THEN 'cpi'
        WHEN 'CUUR0000SAT1'   THEN 'cpi'
        WHEN 'FEDFUNDS'       THEN 'rates'
        WHEN 'DGS10'          THEN 'rates'
        WHEN 'SP500'          THEN 'market'
        WHEN 'VIXCLS'         THEN 'market'
        WHEN 'TNWBSHNO'       THEN 'wealth'
        WHEN 'WFRBST01134'    THEN 'wealth'
        WHEN 'GDPC1'          THEN 'macro'
        WHEN 'UNRATE'         THEN 'macro'
        ELSE 'other'
    END AS topic
FROM DB_TEAM_3.RAW.FRED_OBSERVATIONS o
LEFT JOIN DB_TEAM_3.RAW.FRED_SERIES_METADATA m
    ON o.series_id = m.series_id;

SELECT
    topic,
    COUNT(DISTINCT series_id) AS series_count,
    COUNT(*) AS row_count
FROM STAGING.stg_fred_timeseries
GROUP BY 1
ORDER BY 1;
