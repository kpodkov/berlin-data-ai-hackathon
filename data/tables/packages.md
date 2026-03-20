# Packages Table Schema

Streaming service / provider lookup. One row per provider.
Join with events via: `cc_clickout:providerId::NUMBER = packages.id`

---

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | `id` | NUMBER | Provider identifier. Primary key. Join with events via `cc_clickout:providerId::NUMBER`. |
| 2 | `technical_name` | VARCHAR | Internal technical slug (e.g. "netflix", "amazon_prime_video", "disney_plus"). Stable — use for grouping/filtering in code. |
| 3 | `clear_name` | VARCHAR | Display name (e.g. "Netflix", "Amazon Prime Video", "Disney+"). Use for labels and charts. |
| 4 | `full_name` | VARCHAR | Full official provider name. |
| 5 | `monetization_types` | VARCHAR | Comma-separated monetization models: "flatrate" (subscription), "free" (ad-supported), "rent", "buy", "cinema". A provider may offer multiple (e.g. "flatrate,rent,buy"). |
