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


-- Join events to the exact content row in OBJECTS (movie, show, or episode).
-- title_id + season/episode IS NOT DISTINCT FROM handles all cases in one join:
--   movies/shows: seasonNumber and episodeNumber are NULL, matches the top-level row
--   episodes: matches the specific episode row via season + episode number
SELECT
    e.collector_tstamp,
    o.title,
    o.object_type,
    e.cc_title:seasonNumber::INT         AS season_num,
    e.cc_title:episodeNumber::INT        AS episode_num
FROM DB_JW_SHARED.CHALLENGE.T1 e
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o
  ON o.title_id = e.cc_title:jwEntityId::TEXT
  AND o.season_number IS NOT DISTINCT FROM e.cc_title:seasonNumber::INT
  AND o.episode_number IS NOT DISTINCT FROM e.cc_title:episodeNumber::INT
WHERE e.cc_title:jwEntityId IS NOT NULL
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
