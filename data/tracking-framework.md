# Snowplow Tracking Framework

This dataset is built on [Snowplow Analytics](https://snowplow.io/) — an open-source behavioural data collection platform.

This document gives you a quick intro to how Snowplow works. For the specific events in this dataset, see [events_library.md](events_library.md).

---

## What is Snowplow?

Snowplow captures user behaviour from websites and mobile apps. Every user action — page view, click, scroll — fires an event that is collected, enriched, and loaded into a data warehouse (in our case, Snowflake).

Key characteristics:
- **Event-level granularity** — every interaction is a row
- **Server-side collection** — events are sent to a Snowplow collector server, not processed client-side
- **At-least-once delivery** — the pipeline guarantees events are delivered, but rare duplicates can occur (use `rid` for deduplication)
- **Immutable events** — once collected, events don't change
- **Custom contexts** — additional structured data can be attached to any event via JSON schemas

## Event types

Snowplow has two main event types in this dataset:

| `event` column | Description |
|----------------|-------------|
| `page_view` | User navigated to a new page. No `se_*` fields. |
| `struct` | Structured event — a user interaction with defined category, action, label, property, and value fields (`se_*`). |

## Structured events (`se_*` fields)

Structured events encode what happened using five fields:

| Field | Role |
|-------|------|
| `se_category` | What kind of thing happened (e.g. `clickout`, `watchlist_add`) |
| `se_action` | The specific action (e.g. `flatrate`, `title_clicked`) |
| `se_label` | Optional context (e.g. provider name, click context) |
| `se_property` | Optional property (e.g. video quality) |
| `se_value` | Optional numeric value (e.g. position in list) |

The meaning of each field depends on the `se_category`. See [events_library.md](events_library.md) for the full reference.

## Custom contexts

Snowplow allows attaching structured JSON objects to events — called **contexts**. Each context is defined by a [JSON Schema](https://json-schema.org/) registered in an [Iglu](https://docs.snowplow.io/docs/api-reference/iglu/) schema registry.

In this dataset, contexts appear as `OBJECT` or `VARIANT` columns with a `cc_` prefix. Access fields using Snowflake colon notation:

```sql
-- Example: get the title ID from the title context
SELECT cc_title:jwEntityId::TEXT AS title_id
FROM T1
WHERE cc_title IS NOT NULL
LIMIT 10;
```

The JSON schemas for all contexts in this dataset are in the [snowplow_schemas/](snowplow_schemas/) folder.

## Timestamps

| Column | Description |
|--------|-------------|
| `collector_tstamp` | When the event reached the Snowplow collector server (UTC). Use as the default timestamp. |
| `derived_tstamp` | Adjusted for client clock drift. More accurate for ordering events within a session. |

## Further reading

- [Snowplow Documentation](https://docs.snowplow.io/) — full platform docs
- [Canonical Event Model](https://docs.snowplow.io/docs/fundamentals/canonical-event/) — all standard fields
- [Structured Events](https://docs.snowplow.io/docs/fundamentals/events/#structured-events) — how se_* fields work
- [Custom Contexts](https://docs.snowplow.io/docs/fundamentals/entities/) — how contexts attach data to events
- [YAUAA Enrichment](https://docs.snowplow.io/docs/pipeline-components-and-applications/enrichment-components/available-enrichments/yauaa-enrichment/) — user agent parsing
