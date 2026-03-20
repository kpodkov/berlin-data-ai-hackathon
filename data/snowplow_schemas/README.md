# Context Schemas

JSON schemas for the custom context columns in the event tables.

Each context is an `OBJECT` or `VARIANT` column. Access fields with Snowflake colon notation: `column:fieldName::TYPE`.

Refer to the individual JSON schema files for the full list of fields, types, and descriptions. Below is a quick summary of the most important fields only.

| Schema file | Column in events | Description |
|-------------|-----------------|-------------|
| [title_context.json](title_context.json) | `cc_title` | The content item this event relates to |
| [clickout_context.json](clickout_context.json) | `cc_clickout` | Provider and offer details (clickout events only) |
| [page_type_context.json](page_type_context.json) | `cc_page_type` | Page type and user locale settings |
| [search_context.json](search_context.json) | `cc_search` | Search query and session (search events only) |

The `cc_yauaa` column uses the open-source [YAUAA](https://yauaa.basjes.nl/) enrichment (Yet Another UserAgent Analyzer). It parses the raw `useragent` string into structured device, OS, and browser attributes. The YAUAA schema is publicly documented — this is also a useful source for identifying bot traffic, as bots are often detectable via the `deviceClass` field (e.g. "Robot", "Spider").

---

## Quick reference

### `cc_title`
```
jwEntityId    — title ID, join to objects.object_id (e.g. "tm12345", "ts678")
objectType    — "movie" | "show" | "show_season" | "show_episode"
seasonNumber  — season number (null for movies)
episodeNumber — episode number (null for movies/show-level events)
```

### `cc_clickout`
```
providerId       — streaming service ID, join to packages.id
monetizationType — "flatrate" | "free" | "rent" | "buy" | "cinema" | "ads" | "sports"
clickoutType     — "regular" | "promoted" | "free_trial"
placement        — where on the page the offer was shown
```

### `cc_page_type`
```
pageType      — page the user was on: "title_detail", "home", "search", "popular", ...
appLocale     — user's selected market (ISO 3166-1, e.g. "DE", "GB") — NOT same as geo_country
appLanguage   — UI language (ISO 639-1, e.g. "en", "de")
pageViewUuid  — links events to their parent page view
```

### `cc_search`
```
searchEntry   — what the user typed
searchEntries — array of recent searches (most recent first)
```

### `cc_yauaa`
```
deviceClass           — "Desktop" | "Mobile" | "Phone" | "Tablet" | "Robot" | ...
operatingSystemName   — "Windows" | "Android" | "iOS" | "macOS" | ...
agentName             — browser name: "Chrome" | "Safari" | "Firefox" | ...
```
