-- ETF data extraction for wealth calculator
-- Extracts monthly close prices (last trading day per month) and metadata
-- for all 13 ETFs in DB_TEAM_3.RAW

USE WAREHOUSE WH_TEAM_3_XS;

-- Monthly close prices: last trading day per month per ticker
SELECT
    p.SERIES_ID                              AS ticker,
    LAST_DAY(p.OBS_DATE)                     AS month_end,
    p.OBS_DATE                               AS obs_date,
    p.VALUE                                  AS close
FROM DB_TEAM_3.RAW.MARKET_PRICES p
INNER JOIN (
    -- find the last trading day in each month per ticker
    SELECT
        SERIES_ID,
        YEAR(OBS_DATE)  AS yr,
        MONTH(OBS_DATE) AS mo,
        MAX(OBS_DATE)   AS last_trading_day
    FROM DB_TEAM_3.RAW.MARKET_PRICES
    GROUP BY SERIES_ID, YEAR(OBS_DATE), MONTH(OBS_DATE)
) m
    ON p.SERIES_ID = m.SERIES_ID
    AND p.OBS_DATE = m.last_trading_day
ORDER BY p.SERIES_ID, p.OBS_DATE;

-- ETF metadata
SELECT
    SERIES_ID  AS ticker,
    TITLE      AS title,
    UNITS      AS units,
    FREQUENCY  AS frequency,
    SOURCE     AS source
FROM DB_TEAM_3.RAW.MARKET_METADATA
ORDER BY SERIES_ID;
