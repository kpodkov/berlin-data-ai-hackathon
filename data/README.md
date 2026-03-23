# Data

Everything about the JustWatch challenge dataset — table schemas, event definitions, tracking framework, and example queries.

This is **real anonymised behavioural data** from the JustWatch streaming guide: page views, title clicks, clickouts to providers, watchlist actions, search queries, and more — across up to 45M+ users in 100+ markets.

## What's here

| Path | What it covers |
| ---- | -------------- |
| [tables/events.md](tables/events.md) | Column-level schema for the event tables (T1–T4) — timestamps, user identifiers, structured event fields, and all `cc_*` context columns |
| [tables/objects.md](tables/objects.md) | Content metadata — movies, shows, seasons, episodes, genres, cast, ratings |
| [tables/packages.md](tables/packages.md) | Streaming provider lookup — Netflix, Disney+, etc. with monetization types |
| [events_library.md](events_library.md) | Complete event type reference — every `se_category` / `se_action` combination and what it means |
| [tracking-framework.md](tracking-framework.md) | Snowplow Analytics primer — how events are collected, what `struct` vs `page_view` means, how contexts work |
| [snowplow_schemas/](snowplow_schemas/) | JSON schemas for the `cc_*` context columns (`cc_title`, `cc_clickout`, `cc_page_type`, `cc_search`) with field descriptions and fill rates |
| [examples/starter_queries.sql](examples/starter_queries.sql) | 5 ready-to-run queries — event breakdown, top titles, provider analysis, trending content, genre popularity |
| [examples/query_snippets.sql](examples/query_snippets.sql) | Reusable SQL patterns — joins to metadata, login filtering, market vs location, device detection |

## The tables

All data lives in `DB_JW_SHARED.CHALLENGE` (read-only, shared across all teams).

| Table | Rows | Size | Geography | Period |
| ----- | ---- | ---- | --------- | ------ |
| **T1** | 9.2M | 1.3 GB | Germany only | Dec 2025 |
| **T2** | 40M | 5.7 GB | 8 EU markets | Dec 2025 |
| **T3** | 128M | 17.9 GB | 8 EU markets | Nov 25 – Jan 26 |
| **T4** | 254M | 36.1 GB | 15 global markets | Nov – Dec 25 |
| **OBJECTS** | 13M | 1.1 GB | — | — |
| **PACKAGES** | 1,526 | — | — | — |

**Start with T1** — it's small and fast. Validate your queries there, then swap the table name to scale up.

## Key things to know

- **Deduplicate with `rid`**, not `event_id` — at-least-once delivery means rare duplicates exist
- **Filter bots** — `cc_yauaa:deviceClass::TEXT NOT IN ('Robot', 'Spy', 'Hacker')` returns no rows in the hackathon dataset (bots have been pre-filtered), but it's good practice to include
- **`appLocale` ≠ `geo_country`** — a German expat in France has `appLocale='DE'` but `geo_country='FR'`
- **Events are split between `struct`** (structured events with `se_*` fields) **and `page_view`**
- **Context columns are VARIANT/OBJECT** — access nested fields with colon notation: `cc_title:jwEntityId::TEXT`
