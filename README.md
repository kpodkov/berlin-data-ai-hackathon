# Berlin Analytics & AI Hackathon

**March 23, 2026 · Snowflake Office Berlin**

A one-day hackathon exploring real-world streaming data with modern analytics tools. Build something meaningful from millions of real user interactions on the JustWatch platform.

---

## The Partners

**[JustWatch](https://www.justwatch.com/)** — The world's leading streaming guide, helping 45M+ users discover where to watch movies and shows across 100+ streaming services. JustWatch provides the challenge dataset: real anonymised behavioural data from the platform.

**[Snowflake](https://www.snowflake.com/)** — Cloud data platform where all hackathon data lives. Each team gets a dedicated Snowflake environment with compute resources and shared access to the challenge data.

**[Lightdash](https://www.lightdash.com/)** — Open-source BI tool connected to your Snowflake data. Build dashboards and visualisations for your analysis and final presentation.

**[Collate](https://www.getcollate.io/)** — Data catalog platform. Explore metadata, table relationships, and document your work.

---

## Repo Structure

### Access & connectivity
How to connect to each platform.

| Doc | Platform |
|-----|----------|
| [access/snowflake.md](access/snowflake.md) | Snowflake — credentials, warehouses, quick start |
| [access/lightdash.md](access/lightdash.md) | Lightdash — BI dashboards and visualisation |
| [access/collate.md](access/collate.md) | Collate — data catalog |

### Data
Everything about the challenge dataset — table schemas, tracking framework, event reference, and example queries.

| Doc | What it covers |
|-----|----------------|
| [data/tracking-framework.md](data/tracking-framework.md) | Snowplow 101 — how the tracking pipeline works |
| [data/events_library.md](data/events_library.md) | All event types — what each se_category/se_action means |
| [data/tables/events.md](data/tables/events.md) | Event table columns (shared by T1–T4) |
| [data/tables/objects.md](data/tables/objects.md) | Title/content metadata columns |
| [data/tables/packages.md](data/tables/packages.md) | Streaming service lookup columns |
| [data/snowplow_schemas/](data/snowplow_schemas/) | JSON schemas for context columns — the primary reference for cc_title, cc_clickout, cc_page_type, cc_search |
| [data/examples/query_snippets.sql](data/examples/query_snippets.sql) | Common query patterns — joins, login status, market vs location |
| [data/examples/starter_queries.sql](data/examples/starter_queries.sql) | 5 ready-to-run queries |

### Challenge
Ideas and directions for what to build.

| Doc | What it covers |
|-----|----------------|
| [challenge/challenge_ideas.md](challenge/challenge_ideas.md) | 5 challenge directions + tips |

Vendor-provided PDFs and materials are in [access/resources/](access/resources/).

---

## The Data at a Glance

All data is in `DB_JW_SHARED.CHALLENGE` — shared across all teams, read-only.

| Table | What | Rows | Size |
|-------|------|------|------|
| T1 | Events — Germany · Dec 2025 | 9.2M | 1.3 GB |
| T2 | Events — 8 EU markets · Dec 2025 | 40M | 5.7 GB |
| T3 | Events — 8 EU markets · Nov 25 – Jan 26 | 128M | 17.9 GB |
| T4 | Events — 15 global markets · Nov – Dec 25 | 254M | 36.1 GB |
| OBJECTS | Title metadata (movies, shows, episodes) | 2.3M | 1.1 GB |
| PACKAGES | Streaming service lookup | 1,526 | — |

Each team also has a private database `DB_TEAM_<N>` for building your own tables and models.
