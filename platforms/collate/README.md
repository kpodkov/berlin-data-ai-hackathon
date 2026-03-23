# Collate

[Collate](https://www.getcollate.io/) (powered by [OpenMetadata](https://open-metadata.org/)) is a data catalog and governance platform. Use it to explore table schemas, understand data relationships, and document your work throughout the hackathon.

## Connection

- **URL**: [berlin-ai-data-hack.pov.getcollate.io](https://berlin-ai-data-hack.pov.getcollate.io/signin)
- **Username**: your email address (same as your Snowflake credentials)
- **Password**: `Collate<3`

## What's cataloged

Collate is connected to the hackathon Snowflake account and has ingested the full challenge dataset:

| What's ingested | What you can explore |
| --------------- | -------------------- |
| `DB_JW_SHARED.CHALLENGE` — all 6 tables (T1–T4, OBJECTS, PACKAGES) | Schemas, column types, descriptions, data profiles, sample rows |

### Connect your team's work (optional)

As your team builds dbt models and Lightdash dashboards during the hackathon, you can optionally connect those to Collate too. This gives you a unified catalog across your entire stack:

| Service | What it adds to Collate | Setup guide |
| ------- | ----------------------- | ----------- |
| **dbt** | Model definitions, source mappings, test results, transformation logic from your team's dbt project | [dbt connector docs](https://docs.getcollate.io/connectors/database/dbt/configure-dbt-workflow) |
| **Lightdash** | Dashboard metadata, chart definitions, and their connections to underlying dbt models and Snowflake tables | [Lightdash connector docs](https://docs.getcollate.io/connectors/dashboard/lightdash) |

Ask the Collate team (via Zoom) if you'd like help setting up these connections for your team, or follow the guides above to do it yourself.

## The CHALLENGE schema

Every table and column has been cataloged with descriptions pulled directly from Snowflake, so you can browse the complete data model without writing any SQL.

### Event tables — T1, T2, T3, T4

All four tables share the same **25-column schema** — they differ only in volume and geography.

| Table | Rows | Geography | Period |
| ----- | ---- | --------- | ------ |
| `T1` | 9.2M | Germany only | Dec 2025 |
| `T2` | 40M | 8 EU markets | Dec 2025 |
| `T3` | 128M | 8 EU markets | Nov 2025 – Jan 2026 |
| `T4` | 254M | 15 global markets | Nov – Dec 2025 |

Key column groups you'll find in Collate:

- **Identity & session** — `USER_ID` (anonymous device ID), `LOGIN_ID` (~14% fill rate), `SESSION_ID`, `SESSION_IDX`
- **Timestamps** — `COLLECTOR_TSTAMP` (server-side UTC), `DERIVED_TSTAMP` (clock-drift corrected)
- **Event classification** — `EVENT` (`page_view` ~5%, `struct` ~95%). Structured events use `SE_CATEGORY`, `SE_ACTION`, `SE_LABEL`, `SE_PROPERTY`, `SE_VALUE`
- **Geography** — `GEO_COUNTRY` (IP-based location), `GEO_REGION_NAME`, `GEO_CITY`
- **Semi-structured context columns** (VARIANT/JSON):
  - `CC_TITLE` — content metadata: `jwEntityId` (join key to OBJECTS), `objectType`, `seasonNumber`, `episodeNumber`
  - `CC_CLICKOUT` — provider/offer details: `providerId` (join key to PACKAGES). Clickout events only
  - `CC_PAGE_TYPE` — `pageType`, `appLocale` (user's chosen market — different from `GEO_COUNTRY`)
  - `CC_YAUAA` — parsed user agent: `deviceClass` (Desktop, Phone, Robot), `agentName`. Essential for bot filtering
  - `CC_SEARCH` — `searchEntry` (what the user typed)

### OBJECTS table — ~13M rows

Title and content metadata — one row per content object. **35 columns**:

- **Identity** — `OBJECT_ID` (prefix: `tm` = movie, `ts` = show, `tss` = season, `tse` = episode), `OBJECT_TYPE`, `TITLE_ID`, `PARENT_ID`
- **Content** — `TITLE`, `ORIGINAL_TITLE`, `SHORT_DESCRIPTION`, `RELEASE_YEAR`, `RUNTIME`, `ORIGINAL_LANGUAGE`
- **Classification (arrays)** — `GENRE_TMDB`, `PRODUCTION_COUNTRIES`, `TALENT_CAST`, `TALENT_DIRECTOR`, `TALENT_WRITER`
- **Ratings** — `IMDB_SCORE`, `ID_IMDB`, `URL_IMDB`
- **Media** — `POSTER_JW`, `TRAILERS`

### PACKAGES table — 1,526 rows

Streaming provider lookup — **5 columns**:

- `ID` — provider identifier (join key from `CC_CLICKOUT:providerId`)
- `TECHNICAL_NAME` — slug for code (e.g. `netflix`, `amazon_prime_video`)
- `CLEAR_NAME` — display name for charts (e.g. "Netflix", "Disney+")
- `FULL_NAME` — full official name
- `MONETIZATION_TYPES` — comma-separated: `flatrate` (SVOD), `free` (AVOD), `rent` (TVOD), `buy` (EST), `cinema`

### How the tables connect

```
Events (T1–T4)                       OBJECTS
  CC_TITLE:jwEntityId::TEXT  ───→    OBJECT_ID       (what content)

Events (T1–T4)                       PACKAGES
  CC_CLICKOUT:providerId::NUMBER ───→  ID            (which provider)
```

## Key features for the hackathon

### Search & Discovery

Use the **global search bar** to find tables, columns, and metadata across the dataset — no SQL required. Look up field names like `CC_TITLE` or `SE_CATEGORY` and jump straight to the column definition.

### Schema Exploration

Click into any table to see every column with its data type and description. Especially useful for the **semi-structured VARIANT/JSON fields** (`CC_TITLE`, `CC_CLICKOUT`, `CC_PAGE_TYPE`, `CC_YAUAA`, `CC_SEARCH`) — the descriptions explain the nested keys and Snowflake colon-notation access patterns. Array columns (`GENRE_TMDB`, `PRODUCTION_COUNTRIES`, `TALENT_CAST`) note that `LATERAL FLATTEN` is needed.

### Data Profiler & Sample Data

The profiler gives you column-level statistics — row counts, distinct values, null percentages, value distributions — without running a single query. Sample data lets you preview actual rows directly in Collate, which is especially useful for understanding the VARIANT/JSON columns before writing SQL.

### Documentation & Tagging

Add descriptions, tags, and notes to any table or column. This becomes your team's shared knowledge base — tag noisy `SE_ACTION` values, flag useful genre groupings, or document data quality findings for your teammates.

### Glossary

Create a shared **business vocabulary** for your team. Define terms like "clickout" (purchase-intent signal), "bot traffic" (`CC_YAUAA:deviceClass` in Robot/Spy/Hacker), or "market" (user locale via `appLocale`, not physical location). Link glossary terms to columns across the catalog.

### Data Quality Testing

Set up **test cases** on tables and columns — check `RID` uniqueness, validate `SE_CATEGORY` values, or monitor null rates. Test definitions are built in; you pick the type, configure parameters, and Collate tracks results.

### Cross-platform visibility (optional)

If your team connects dbt and Lightdash to Collate, you get a unified view of your entire data stack — trace from a Lightdash dashboard back to the dbt model that powers it and the Snowflake table underneath. This is optional but powerful if you want to catalog your team's full workflow.

### Chrome Extension — metadata while you work

Install the [Collate Browser Extension](https://chromewebstore.google.com/detail/collate/ndjnpiadedlmgddlpeklbnobebkpkdgb) to access metadata **directly inside Snowflake** without switching tabs.

**Setup:**

1. Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/collate/ndjnpiadedlmgddlpeklbnobebkpkdgb) and pin it to your toolbar
2. Click the extension icon and enter the instance URL: `https://berlin-ai-data-hack.pov.getcollate.io`
3. Sign in with your hackathon credentials

While browsing tables in Snowflake, click the extension to instantly see column descriptions, tags, glossary terms, and profiler stats — all without leaving your query editor.

### AskCollate — AI-powered data assistant

AskCollate is a built-in AI assistant that lets you explore the catalog using **natural language**. Open it from the Collate UI and ask questions like:

- _"List all tables in the CHALLENGE schema with their descriptions"_
- _"What columns in T1 are related to user identity?"_
- _"Show me the top 10 rows from the OBJECTS table"_
- _"Find columns with high null rates"_
- _"Generate a SQL query to count clickout events by provider"_

AskCollate can generate SQL, suggest data quality tests, and help you navigate the dataset without memorizing column names or table structures. [Learn more](https://docs.getcollate.io/collate-ai/ask-collate)

### MCP Server — connect Collate to your AI tools

Collate exposes an [MCP (Model Context Protocol) server](https://docs.getcollate.io/collate-ai/mcp/connect) that lets AI tools like Claude, Cursor, or any MCP-compatible client interact with the catalog programmatically.

**Endpoint:** `https://berlin-ai-data-hack.pov.getcollate.io/mcp`

**Setup:**

1. Generate a **Personal Access Token** in Collate: click your avatar → Settings → Personal Access Tokens → Generate New Token
2. Add the MCP server to your AI tool's configuration. For Claude, add to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "collate": {
         "url": "https://berlin-ai-data-hack.pov.getcollate.io/mcp",
         "headers": {
           "Authorization": "Bearer <YOUR_PERSONAL_ACCESS_TOKEN>"
         }
       }
     }
   }
   ```
3. Restart your AI tool — it can now search metadata, look up table details, create glossary terms, and more, directly from your coding environment

This means you can ask Claude to look up column descriptions, find tables, or create glossary terms without ever opening the Collate UI. [Setup guide for Claude](https://docs.getcollate.io/how-to-guides/mcp/claude)

## Quick start

1. **Install the Chrome extension** — get it from the [Chrome Web Store](https://chromewebstore.google.com/detail/collate/ndjnpiadedlmgddlpeklbnobebkpkdgb), pin it, and set the instance URL to `https://berlin-ai-data-hack.pov.getcollate.io`
2. **Sign in** — go to [berlin-ai-data-hack.pov.getcollate.io](https://berlin-ai-data-hack.pov.getcollate.io/signin) and log in with your email and password `Collate<3`
3. **Explore a table** — search for `T1` or `OBJECTS`, click in, browse columns, profiler stats, and sample data
4. **Start documenting** — add tags and notes as you work through your challenge

## Tips for the hackathon

- **Install the Chrome extension first** — 30 seconds of setup gives you Collate metadata inside Snowflake for the rest of the day
- **Ask AskCollate before writing SQL** — instead of guessing column names, ask in natural language: _"which columns track user engagement?"_ or _"generate a query for top titles by clickout count"_
- **Connect the MCP server to Claude** — if you're using Claude Code or an AI coding assistant, connecting the Collate MCP means your AI can look up schemas and column descriptions on the fly while helping you write queries
- **Use sample data to understand VARIANT columns** — check real values of `CC_TITLE`, `CC_CLICKOUT`, and `CC_YAUAA` before writing colon-notation queries
- **Check the profiler before building your analysis** — null rates, distinct counts, and value distributions for every column, no SQL needed
- **Start with OBJECTS** — browse the 35 columns to understand what content dimensions are available (genres, cast, ratings, release info)
- **Look up column descriptions** — every column has a description from Snowflake baked into Collate. Saves you from guessing what `SE_LABEL` or `CC_YAUAA` contains
- **Connect dbt and Lightdash (optional)** — if your team wants a full catalog of your work, ask us to connect your dbt models and Lightdash dashboards to Collate
- **Build a glossary early** — define key terms ("engagement", "bot", "market") so your team is aligned. Link definitions to columns
- **Tag what you discover** — found bot traffic signatures or useful genre groupings? Tag them in Collate for your teammates
- **Document as you go** — your annotations persist all day. When it's time to present, you'll have a trail of what you explored and why

## Resources

| Resource | What you'll learn |
| -------- | ----------------- |
| [Interactive demos](https://www.getcollate.io/learning-center/resource/demos) | Search, discovery, data quality, and the catalog UI |
| [Tutorials](https://www.getcollate.io/learning-center/resource/tutorials) | Step-by-step guides for common tasks |
| [Sandbox access](https://www.getcollate.io/welcome) | Try Collate on sample data to get familiar with the UI |

## Support

The Collate team (**Lucas**, **Jo**, **Aydin**) will be supporting virtually throughout the event via Zoom in the training room — flag us for help with the catalog, data quality, or documenting your findings.
