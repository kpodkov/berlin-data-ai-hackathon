-- ============================================================
-- Query Snippets — common patterns for working with the data
-- Replace T1 with T2/T3/T4 as needed
-- ============================================================


-- Join events to title metadata (top-level title: movie or show)
-- cc_title:jwEntityId always points to the top-level title (tm/ts prefix).
-- This gives you the movie or show name for any event.
SELECT
    e.collector_tstamp,
    e.cc_title:jwEntityId::TEXT         AS title_id,
    e.cc_title:objectType::TEXT         AS object_type,
    o.title,
    o.release_year,
    e.se_category
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o
  ON e.cc_title:jwEntityId::TEXT = o.object_id
LIMIT 100;


-- Join events to the specific season/episode (when available)
-- For show events, cc_title carries seasonNumber and episodeNumber.
-- To find the exact season or episode in the objects table, match on
-- both the parent show ID and the season/episode numbers.
SELECT
    e.collector_tstamp,
    e.cc_title:jwEntityId::TEXT          AS show_id,
    e.cc_title:seasonNumber::INT         AS season_num,
    e.cc_title:episodeNumber::INT        AS episode_num,
    o.title                              AS show_title,
    ep.title                             AS episode_title
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o
  ON e.cc_title:jwEntityId::TEXT = o.object_id
LEFT JOIN DB_JW_SHARED.CHALLENGE.OBJECTS ep
  ON ep.title_id = o.object_id
  AND ep.object_type = 'episode'
  AND ep.season_number IS NOT DISTINCT FROM e.cc_title:seasonNumber::INT
  AND ep.episode_number IS NOT DISTINCT FROM e.cc_title:episodeNumber::INT
WHERE e.cc_title:objectType::TEXT = 'show_episode'
LIMIT 100;


-- Join clickout events to streaming provider names (packages)
SELECT
    e.collector_tstamp,
    e.cc_clickout:providerId::NUMBER    AS provider_id,
    p.clear_name                        AS provider_name,
    e.cc_clickout:monetizationType::TEXT AS monetization,
    e.cc_title:jwEntityId::TEXT         AS title_id
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.PACKAGES p
  ON e.cc_clickout:providerId::NUMBER = p.id
WHERE e.se_category = 'clickout'
LIMIT 100;


-- Logged-in vs logged-out users
-- login_id is extracted from the login context. NULL = not logged in.
SELECT
    IFF(login_id IS NOT NULL, 'logged_in', 'logged_out') AS login_status,
    COUNT(*)                AS events,
    COUNT(DISTINCT user_id) AS unique_devices
FROM DB_JW_SHARED.CHALLENGE.T1
GROUP BY 1;


-- User's selected market vs physical location
-- appLocale = what market the user chose in settings (e.g. "DE")
-- geo_country = where the user physically is (from IP geolocation)
-- These often differ — a German user travelling in France still has appLocale = "DE"
SELECT
    cc_page_type:appLocale::TEXT  AS market,
    geo_country                   AS physical_country,
    COUNT(*)                      AS events
FROM DB_JW_SHARED.CHALLENGE.T1
WHERE cc_page_type IS NOT NULL
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 20;


-- Device class and browser from YAUAA context
-- Look for deviceClass = "Robot" to identify bot traffic
SELECT
    cc_yauaa:deviceClass::TEXT    AS device_class,
    cc_yauaa:agentName::TEXT      AS browser,
    COUNT(*)                      AS events
FROM DB_JW_SHARED.CHALLENGE.T1
WHERE cc_yauaa IS NOT NULL
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 20;
