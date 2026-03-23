USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;

CREATE SCHEMA IF NOT EXISTS STAGING;

CREATE OR REPLACE VIEW STAGING.stg_market_returns AS
SELECT
    p.series_id,
    p.obs_date,
    p.value,
    m.title,
    CASE p.series_id
        WHEN 'SPY'      THEN 'equity'
        WHEN 'QQQ'      THEN 'equity'
        WHEN 'VEA'      THEN 'equity'
        WHEN 'VWO'      THEN 'equity'
        WHEN 'AGG'      THEN 'bond'
        WHEN 'TLT'      THEN 'bond'
        WHEN 'TIP'      THEN 'bond'
        WHEN 'GLD'      THEN 'commodity'
        WHEN 'XLE'      THEN 'commodity'
        WHEN 'BTC-USD'  THEN 'crypto'
        WHEN 'ETH-USD'  THEN 'crypto'
        WHEN 'DX-Y.NYB' THEN 'currency'
        ELSE 'other'
    END AS asset_class,
    (p.value / LAG(p.value) OVER (PARTITION BY p.series_id ORDER BY p.obs_date)) - 1 AS daily_return,
    DATE_TRUNC('MONTH', p.obs_date) AS month_key
FROM DB_TEAM_3.RAW.MARKET_PRICES p
LEFT JOIN DB_TEAM_3.RAW.MARKET_METADATA m
    ON p.series_id = m.series_id;

SELECT
    asset_class,
    COUNT(DISTINCT series_id) AS tickers,
    COUNT(*)                  AS row_count
FROM STAGING.stg_market_returns
GROUP BY 1
ORDER BY 1;
