# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resource repository for a one-day analytics & AI hackathon (March 23, 2026) at Snowflake Office Berlin. Participants analyze anonymized JustWatch behavioral data (streaming service usage across 45M+ users in 100+ markets). All computation runs in Snowflake — no local code execution.

**Partners:** JustWatch (data), Snowflake (compute), Lightdash (BI/dashboards), Collate (data catalog)

## How to Work With Participants

You are a hackathon pair programmer. Your job: help participants explore data, write queries, build analyses, and iterate fast.

**First steps with any participant:**

1. Ask which **team number** they are (needed for warehouse and database names)
2. Ask what **challenge direction** they're interested in (see `challenge_ideas.md`) — or if they have their own idea
3. Start prototyping on **T1** (9.2M rows, Germany only) — it's fast and cheap
4. Scale to T2–T4 only after the query logic is validated

**Prototyping strategy:** Always develop on T1, then change the table name to T2/T3/T4 when scaling up. All event tables share the same schema.

## Query Execution

**All Snowflake queries run via `snow sql` CLI.** The connection name depends on the participant's `~/.snowflake/connections.toml` config (see `platforms/snowflake/programmatic-access.md` for setup). Template config is at `platforms/snowflake/connections.toml`.

```bash
# Basic query (replace "hackathon" with the participant's connection name)
snow sql -q "SELECT * FROM DB_JW_SHARED.CHALLENGE.T1 LIMIT 10" -c hackathon

# Set warehouse first (replace 1 with team number)
snow sql -q "USE WAREHOUSE WH_TEAM_1_XS" -c hackathon

# Wide results or semi-structured output
snow sql -q "SELECT * FROM DB_JW_SHARED.CHALLENGE.PACKAGES LIMIT 5" -c hackathon --format json

# Multi-statement (set warehouse + run query)
snow sql -q "USE WAREHOUSE WH_TEAM_1_XS; SELECT COUNT(*) FROM DB_JW_SHARED.CHALLENGE.T1" -c hackathon

# Run SQL from a file
snow sql -f my_query.sql -c hackathon
```

**Warehouse selection** (replace `<N>` with team number):

- `WH_TEAM_<N>_XS` — Default for exploration and T1/T2
- `WH_TEAM_<N>_S` — For T3 or queries > 30 seconds on XS
- `WH_TEAM_<N>_M` — For T3/T4 with complex joins

## Snowflake Environment

- **Account:** `<ACCOUNT_ID>.snowflakecomputing.com`
- **Shared data:** `DB_JW_SHARED.CHALLENGE` (read-only, all teams) — T1–T4 event tables + OBJECTS + PACKAGES
- **Team workspace:** `DB_TEAM_<N>` (private per team) — create schemas, tables, views here

**Persisting results to team database:**

```sql
USE DATABASE DB_TEAM_1;
CREATE SCHEMA IF NOT EXISTS analysis;
CREATE OR REPLACE TABLE analysis.my_results AS
SELECT ... FROM DB_JW_SHARED.CHALLENGE.T1 WHERE ...;
```

## Data Architecture

### Event Tables (T1–T4) — all share the same schema

| Table | Rows | Size | Geography | Period |
| ----- | ---- | ---- | --------- | ------ |
| T1 | 9.2M | 1.3 GB | Germany only | Dec 2025 |
| T2 | 40M | 5.7 GB | 8 EU markets | Dec 2025 |
| T3 | 128M | 17.9 GB | 8 EU markets | Nov 25 – Jan 26 |
| T4 | 254M | 36.1 GB | 15 global markets | Nov – Dec 25 |

- `OBJECTS` — ~13M rows of title/content metadata (movies, shows, seasons, episodes)
- `PACKAGES` — 1,526 rows of streaming provider lookup

### Key Event Columns

- **Deduplication:** Use `rid` (not `event_id`) to deduplicate rows
- **Timestamps:** `collector_tstamp` (server-side UTC) or `derived_tstamp` (client clock drift adjusted)
- **User identity:** `user_id` (anonymous), `login_id` (only when logged in), `session_id`
- **Event type:** `event` = `page_view` or `struct` (split varies by table); structured events use `se_category`, `se_action`, `se_label`, `se_property`, `se_value`
- **Custom context JSON columns** (VARIANT type, prefixed `cc_`):
  - `cc_title` — Content metadata (jwEntityId, objectType, season/episode numbers)
  - `cc_page_type` — Page type and `appLocale` (user's chosen market, distinct from geo_country)
  - `cc_clickout` — Provider ID and offer details (only on clickout events)
  - `cc_yauaa` — Parsed user agent (deviceClass, agentName, etc.) — bots pre-filtered from dataset
  - `cc_search` — Search query text

### OBJECTS Table Key Columns

- `object_id` — Prefixed IDs: `tm` = movie, `ts` = show, `tss` = season, `tse` = episode
- `parent_id` / `show_season_id` — Link episodes/seasons to parent titles
- Array columns needing FLATTEN: `genre_tmdb`, `production_countries`, `talent_cast`, `talent_director`

## Critical SQL Patterns

```sql
-- Access JSON context fields (colon notation + cast)
cc_title:jwEntityId::TEXT          -- content ID
cc_title:objectType::TEXT          -- movie / show / show_season / show_episode (note: mixed case in data, e.g. 'movie' and 'MOVIE')
cc_page_type:appLocale::TEXT       -- user's chosen market (e.g. 'DE')
cc_yauaa:deviceClass::TEXT         -- 'Desktop', 'Phone', etc.

-- Note: bot traffic (Robot, Spy, Hacker) has been pre-filtered from the hackathon dataset

-- Deduplication via rid
QUALIFY ROW_NUMBER() OVER (PARTITION BY rid ORDER BY collector_tstamp) = 1

-- Join events to title metadata
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o
  ON cc_title:jwEntityId::TEXT = o.object_id

-- Join clickouts to provider names
JOIN DB_JW_SHARED.CHALLENGE.PACKAGES p
  ON cc_clickout:providerId::NUMBER = p.id

-- Flatten array columns in OBJECTS (genres, countries, cast)
LATERAL FLATTEN(input => genre_tmdb) AS g
-- then reference: g.value::TEXT

-- Clickout events (monetization intent)
WHERE se_category = 'clickout'
  AND se_action IN ('flatrate', 'free', 'rent', 'buy', 'ads', 'sports', 'cinema')

-- Top-N per group (Snowflake QUALIFY clause)
QUALIFY ROW_NUMBER() OVER (PARTITION BY geo_country ORDER BY event_count DESC) <= 10

-- Join to exact content row (movie, show, or episode) in one join
-- IS NOT DISTINCT FROM matches NULLs, so movies/shows match the top-level row
JOIN DB_JW_SHARED.CHALLENGE.OBJECTS o
  ON o.title_id = cc_title:jwEntityId::TEXT
  AND o.season_number IS NOT DISTINCT FROM cc_title:seasonNumber::INT
  AND o.episode_number IS NOT DISTINCT FROM cc_title:episodeNumber::INT
```

## Snowflake Cortex AI

Cortex LLM and ML functions are available on this account for AI enrichment:

```sql
-- Text generation (use for classification, summarization, enrichment)
SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-70b',
  'Classify this movie genre based on the title and description: ' || title || ' - ' || short_description
) FROM DB_JW_SHARED.CHALLENGE.OBJECTS LIMIT 5;

-- Sentiment analysis
SELECT SNOWFLAKE.CORTEX.SENTIMENT(short_description)
FROM DB_JW_SHARED.CHALLENGE.OBJECTS WHERE short_description IS NOT NULL LIMIT 10;

-- Text embeddings (for similarity/clustering)
SELECT SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', short_description)
FROM DB_JW_SHARED.CHALLENGE.OBJECTS WHERE short_description IS NOT NULL LIMIT 10;
```

Use Cortex for: content classification, title clustering, semantic similarity, description-based recommendations, and any NLP enrichment of the OBJECTS table.

## Common Event Types Reference

| se_category | se_action | Meaning |
| ----------- | --------- | ------- |
| `userinteraction` | `title_clicked` | User clicked a title card |
| `clickout` | `flatrate`/`free`/`rent`/`buy`/`ads`/`sports`/`cinema` | Purchase intent (monetization type) |
| `watchlist_add` / `watchlist_remove` | varies by UI element | Watchlist management |
| `seenlist_add` / `seenlist_remove` | varies by UI element | Seen list management |
| `likelist_add` / `dislikelist_add` | varies by UI element | Like/dislike actions |
| `youtube_started` | `movie`/`show`/`show_season` | Trailer play |
| `search_suggest_click` | — | Search result clicked |
| (page_view) | `event = 'page_view'`, se_* fields are NULL | Page navigation |

For full event details including se_label/se_property/se_value meanings, see `data/events_library.md`.

## Data Quality & Gotchas

- **Bot traffic pre-filtered** — Bot traffic (Robot, Spy, Hacker deviceClass values) has been pre-filtered from the hackathon dataset, so no bot filtering is needed. The filter `cc_yauaa:deviceClass::TEXT NOT IN ('Robot', 'Spy', 'Hacker')` is shown in examples for reference only.
- **appLocale ≠ geo_country** — `cc_page_type:appLocale::TEXT` is the market the user chose (e.g. German expat in France has appLocale='DE', geo_country='FR')
- **Deduplicate via `rid`** — At-least-once delivery means rare duplicate events exist
- **Movies and shows behave differently** — A movie gets a burst around release then fades; shows accumulate engagement over seasons. Analyze them separately.
- **cc_title:jwEntityId always points to the top-level title** (tm/ts prefix) even for episode-level events — use seasonNumber/episodeNumber to drill into episodes

## dbt Template

A starter dbt project is in `platforms/dbt/dbt_template/` with source definitions and base models. Teams can use this to organize SQL transformations if they prefer dbt over raw SQL. Requires a dbt profile configured for their team's Snowflake connection (see `platforms/dbt/profiles.md`).

## Repository Reference

- `data/tables/` — Full column-level schemas for events, objects, packages
- `data/events_library.md` — Complete event type reference with all se_* field combinations
- `data/tracking-framework.md` — Snowplow Analytics primer (how events are collected)
- `data/snowplow_schemas/` — JSON schemas for all cc_* context columns with field descriptions and fill rates
- `data/examples/starter_queries.sql` — 5 ready-to-run queries (event breakdown, top titles, providers, trending, genre popularity)
- `data/examples/query_snippets.sql` — Join patterns (title metadata, episodes, providers, logged-in users, market vs location, device detection)
- `platforms/` — Platform setup guides (Snowflake, dbt, Lightdash, Collate)
- `challenge_ideas.md` — 6 challenge directions with detailed guidance
