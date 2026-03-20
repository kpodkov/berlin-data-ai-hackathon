-- ============================================================
-- Starter Queries
-- Use T1 for prototyping, scale to T2-T4 when ready
-- ============================================================


-- 1. Event breakdown by type
SELECT se_category, se_action, COUNT(*) AS events
FROM DB_JW_SHARED.CHALLENGE.T1
GROUP BY 1, 2
ORDER BY 3 DESC;


-- 2. Top clicked titles in Germany
SELECT o.title, o.object_type, o.release_year, COUNT(*) AS clicks
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o ON e.cc_title:jwEntityId::TEXT = o.object_id
WHERE e.se_category = 'userinteraction'
  AND e.se_action = 'title_clicked'
  AND e.geo_country = 'DE'
GROUP BY 1, 2, 3
ORDER BY 4 DESC
LIMIT 20;


-- 3. Top streaming providers by clickouts
SELECT p.clear_name AS provider, e.se_action AS monetization, COUNT(*) AS clickouts
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.PACKAGES p ON e.cc_clickout:providerId::NUMBER = p.id
WHERE e.se_category = 'clickout'
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 20;


-- 4. Weekly trending titles
SELECT DATE_TRUNC('week', e.collector_tstamp) AS week, o.title, COUNT(*) AS clickouts
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o ON e.cc_title:jwEntityId::TEXT = o.object_id
WHERE e.se_category = 'clickout'
GROUP BY 1, 2
QUALIFY ROW_NUMBER() OVER (PARTITION BY week ORDER BY clickouts DESC) <= 10
ORDER BY week DESC, clickouts DESC;


-- 5. Genre popularity by market
SELECT
    cc_page_type:appLocale::TEXT AS market,
    g.value::TEXT AS genre,
    COUNT(*) AS clicks
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o ON e.cc_title:jwEntityId::TEXT = o.object_id,
LATERAL FLATTEN(input => o.genre_tmdb) g
WHERE e.se_category = 'userinteraction'
  AND e.se_action = 'title_clicked'
GROUP BY 1, 2
QUALIFY ROW_NUMBER() OVER (PARTITION BY market ORDER BY clicks DESC) <= 5
ORDER BY market, clicks DESC;
