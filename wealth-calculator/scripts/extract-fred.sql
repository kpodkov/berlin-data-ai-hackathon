-- FRED data extraction queries for the wealth calculator web app
-- Run via: snow sql -f extract-fred.sql -c hackathon

USE WAREHOUSE WH_TEAM_3_XS;

-- Query 1: all observations joined to metadata, ordered for processing
SELECT
    o.SERIES_ID,
    TO_CHAR(o.OBS_DATE, 'YYYY-MM-DD') AS obs_date,
    o.VALUE,
    m.TITLE,
    m.UNITS,
    m.FREQUENCY,
    m.SEASONAL_ADJUSTMENT,
    m.LAST_UPDATED,
    m.CATEGORY
FROM DB_TEAM_3.RAW.FRED_OBSERVATIONS o
JOIN DB_TEAM_3.RAW.FRED_SERIES_METADATA m
    ON o.SERIES_ID = m.SERIES_ID
WHERE o.SERIES_ID IS NOT NULL
  AND o.OBS_DATE IS NOT NULL
  AND o.VALUE IS NOT NULL
ORDER BY o.SERIES_ID, o.OBS_DATE;

-- Query 2: series count validation (should be 32)
SELECT COUNT(DISTINCT SERIES_ID) AS series_count
FROM DB_TEAM_3.RAW.FRED_SERIES_METADATA;

-- Query 3: observation count per series
SELECT
    SERIES_ID,
    COUNT(*) AS obs_count,
    MIN(OBS_DATE) AS first_date,
    MAX(OBS_DATE) AS last_date
FROM DB_TEAM_3.RAW.FRED_OBSERVATIONS
WHERE VALUE IS NOT NULL
GROUP BY SERIES_ID
ORDER BY SERIES_ID;
