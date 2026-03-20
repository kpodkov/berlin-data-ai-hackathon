# Events Library

Events are encoded as combinations of `se_category` + `se_action` (+ optionally `se_label`, `se_property`, `se_value`).
Page view events have `event = 'page_view'` and no se_* fields.

This document describes every event type present in the dataset.

---

## Page views

| event | se_category | se_action | Description |
|-------|-------------|-----------|-------------|
| `page_view` | NULL | NULL | User navigated to a page. Page details are in `cc_page_type:pageType`. |

---

## Title clicks

| se_category | se_action | se_label | se_property | se_value | Description |
|-------------|-----------|----------|-------------|----------|-------------|
| `userinteraction` | `title_clicked` | Context (e.g. "results", "home", "suggestion") | Page area (e.g. "search", "season") | Position/index in list (0-based) | User clicked on a title card. |

---

## Clickouts

User clicked through to a streaming provider to watch, rent, or buy content. The `cc_clickout` context carries provider and offer details.

### Monetization types

The `se_action` on clickout events (and `cc_clickout:monetizationType`) indicates the business model of the offer. These are standard industry terms:

| se_action | Industry term | What it means for the user |
|-----------|--------------|---------------------------|
| `flatrate` | SVOD (Subscription VOD) | User has a subscription — content is included. Examples: Netflix, Disney+, Amazon Prime Video. |
| `free` | AVOD (Ad-supported VOD) | Content is free but ad-supported. Examples: Pluto TV, Tubi, Freevee. |
| `ads` | AVOD | Same as `free` — ad-supported access. |
| `rent` | TVOD (Transactional VOD) | User pays per-title for temporary access (typically 48 hours). Examples: Apple TV rent, Google Play rent. |
| `buy` | EST (Electronic Sell-Through) | User pays per-title for permanent digital ownership. Examples: Apple TV purchase, Google Play purchase. |
| `cinema` | Theatrical | User clicks to a cinema booking page for theatrical release. |
| `sports` | Sports streaming | User clicks to a sports streaming provider. |

In the streaming industry, analysing the split between SVOD, AVOD, and TVOD reveals how consumers prefer to access content — and this varies significantly by market and genre.

| se_category | se_action | se_label | se_property | se_value | Description |
|-------------|-----------|----------|-------------|----------|-------------|
| `clickout` | `flatrate` | Provider name (e.g. "Netflix") | Quality ("hd", "sd") | Placement type (see below) | Subscription clickout |
| `clickout` | `free` | Provider name | Quality | Placement type | Free/ad-supported clickout |
| `clickout` | `rent` | Provider name | Quality | Placement type | Rental clickout |
| `clickout` | `buy` | Provider name | Quality | Placement type | Purchase clickout |
| `clickout` | `cinema` | Cinema name (e.g. "ODEON") | Page area | — | Cinema clickout |
| `clickout` | `ads` | Provider name | Quality | Placement type | Ad-supported clickout |
| `clickout` | `sports` | Provider name | Quality | Placement type | Sports clickout |

**se_value placement types for clickouts:**
- 0 = regular offer
- 1 = promoted offer
- 2 = backdrop placement
- 3 = bottom placement
- 4 = free trial
- 5 = buybox banner

For detailed clickout fields (price, currency, placement name), use `cc_clickout` context.

---

## List actions

User added or removed a title from a personal list. `se_action` indicates the UI element used.

| se_category | se_action examples | Description |
|-------------|--------------------|-------------|
| `watchlist_add` | `lists-panel`, `quick-action-bar`, `buybox`, `NoOfferBell` | Added title to watchlist |
| `watchlist_remove` | `lists-panel`, `watchlist`, `quick-action-bar` | Removed title from watchlist |
| `seenlist_add` | `quick-action-bar`, `watchlist`, `episode-list` | Marked title as seen |
| `seenlist_remove` | `episode-list`, `quick-action-bar`, `watchlist` | Unmarked title as seen |
| `likelist_add` | `quick-action-bar`, `quick-actions`, `like_dislike_poll_modal` | Liked a title |
| `likelist_remove` | `quick-action-bar`, `quick-actions-2nd-bubble` | Removed like |
| `dislikelist_add` | `quick-action-bar`, `quick-actions`, `like_dislike_poll_modal` | Disliked a title |
| `dislikelist_remove` | `quick-action-bar` | Removed dislike |

---

## Trailer views

| se_category | se_action | se_label | se_value | Description |
|-------------|-----------|----------|----------|-------------|
| `youtube_started` | `movie` | Page (e.g. "title-detail") | Trailer index | User started a movie trailer |
| `youtube_started` | `show` | Page | Trailer index | User started a show trailer |
| `youtube_started` | `show_season` | Page | Trailer index | User started a season trailer |

---

## Search

| se_category | se_action | se_label | se_property | se_value | Description |
|-------------|-----------|----------|-------------|----------|-------------|
| `search_suggest_click` | — | — | — | Position in results (0-based) | User clicked a title from search suggestions. `cc_search:searchEntry` has the query text. |
