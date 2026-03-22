# Events Table Schema

All four event tables (T1–T4) share this exact column structure.
They differ only in markets and time period — see the [README](../../README.md) for details.

One row per event. Source: JustWatch Snowplow tracking pipeline.

---

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | `rid` | NUMBER | Internal row identifier. Use for deduplication — event_id may have rare duplicates from the Snowplow pipeline. |
| 2 | `event_id` | VARCHAR | Event identifier (UUID). May have rare duplicates due to the nature of the Snowplow tracking pipeline (at-least-once delivery) — use rid for guaranteed uniqueness. |
| 3 | `collector_tstamp` | TIMESTAMP_NTZ | When the Snowplow collector received the event (UTC). Primary timestamp for time-based analysis. |
| 4 | `derived_tstamp` | TIMESTAMP_NTZ | Corrected timestamp accounting for client clock drift. More accurate for ordering events within a session. |
| 5 | `event` | VARCHAR | Snowplow event type: "struct" or "page_view". |
| 6 | `user_id` | VARCHAR | Anonymous device/browser ID assigned by JustWatch. Persistent across sessions on the same device. Not linked to any personal account. |
| 7 | `login_id` | VARCHAR | JustWatch login ID. Present when the user is logged in (~14% of events), NULL otherwise. Useful for identifying cross-device behaviour. |
| 8 | `session_id` | VARCHAR | JustWatch session ID. One session = continuous activity with <30 min inactivity. |
| 9 | `session_idx` | NUMBER | Session number for this user_id. 1 = first session on this device. |
| 10 | `app_id` | VARCHAR | Application identifier: "jw-web", "jw-android", "jw-ios". |
| 11 | `platform` | VARCHAR | Platform code: "web" (~90%), "mob" (~10%). |
| 12 | `se_category` | VARCHAR | Event category. See [events_library.md](../events_library.md) for all values and meanings. NULL for page_view events. |
| 13 | `se_action` | VARCHAR | Action within the category. Meaning depends on se_category — see [events_library.md](../events_library.md). |
| 14 | `se_label` | VARCHAR | Additional label. Meaning varies — see [events_library.md](../events_library.md). |
| 15 | `se_property` | VARCHAR | Additional property. Meaning varies — see [events_library.md](../events_library.md). |
| 16 | `se_value` | NUMBER | Numeric value. Meaning varies — see [events_library.md](../events_library.md). |
| 17 | `geo_country` | VARCHAR | ISO 3166-1 alpha-2 country from IP geolocation (e.g. "DE"). This is the user's physical location, NOT their selected market. For the user's chosen market, use `cc_page_type:appLocale`. |
| 18 | `geo_region_name` | VARCHAR | Region/state from IP (e.g. "Bavaria"). May be null. |
| 19 | `geo_city` | VARCHAR | City from IP. May be null. |
| 20 | `useragent` | VARCHAR | Raw HTTP user agent string. Use cc_yauaa for parsed device/browser attributes. |
| 21 | `cc_title` | VARIANT | Title context — see [snowplow_schemas/title_context.json](../snowplow_schemas/title_context.json). Key: `cc_title:jwEntityId::TEXT` (join to objects.object_id), `cc_title:objectType::TEXT`. |
| 22 | `cc_page_type` | OBJECT | Page type context — see [snowplow_schemas/page_type_context.json](../snowplow_schemas/page_type_context.json). Key: `cc_page_type:pageType::TEXT`, `cc_page_type:appLocale::TEXT` (user's market — NOT same as geo_country). |
| 23 | `cc_clickout` | OBJECT | Clickout context — see [snowplow_schemas/clickout_context.json](../snowplow_schemas/clickout_context.json). Present on clickout events only. Key: `cc_clickout:providerId::NUMBER` (join to packages.id). |
| 24 | `cc_yauaa` | OBJECT | Parsed user agent (YAUAA). Key: `cc_yauaa:deviceClass::TEXT`, `cc_yauaa:agentName::TEXT`. Useful for device segmentation and bot detection. |
| 25 | `cc_search` | OBJECT | Search context — see [snowplow_schemas/search_context.json](../snowplow_schemas/search_context.json). Present on search events. Key: `cc_search:searchEntry::TEXT`. |
