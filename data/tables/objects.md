# Objects Table Schema

Title and content metadata. One row per content object.
Join with events via: `cc_title:jwEntityId::TEXT = objects.object_id`

---

**Note**: 35 columns included. See Collate for interactive schema exploration.

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | `object_id` | VARCHAR | JustWatch content ID. Primary key. Prefix: "tm" = movie, "ts" = show, "tss" = season, "tse" = episode. Join with `cc_title:jwEntityId::TEXT`. |
| 2 | `object_type` | VARCHAR | Content type: "movie", "show", "show_season", "show_episode" (also rare "MOVIE" uppercase). |
| 3 | `title_id` | VARCHAR | Top-level title ID. Same as object_id for movies/shows. Points to the parent show for seasons/episodes. |
| 4 | `parent_id` | VARCHAR | For episodes: object_id of their season. For seasons: object_id of the show. NULL for movies/shows. |
| 5 | `show_season_id` | VARCHAR | For episodes only: object_id of the season. NULL otherwise. |
| 6 | `title` | VARCHAR | Display title in English. |
| 7 | `original_title` | VARCHAR | Title in the original production language (e.g. "Das Boot"). |
| 8 | `translated_title` | VARCHAR | Translated display title where available. |
| 9 | `short_description` | VARCHAR | Short synopsis in English. |
| 10 | `object_text_short_description` | VARCHAR | Localized short description (best available). |
| 11 | `object_text_translated_title` | VARCHAR | Localized title (best available). |
| 12 | `release_year` | NUMBER | Year of release. For shows: year of first episode. |
| 13 | `release_date` | DATE | Full release date. May be null. |
| 14 | `runtime` | NUMBER | Runtime in minutes. For movies: total. For shows: average episode runtime. |
| 15 | `original_language` | VARCHAR | ISO 639-1 language code (e.g. "en", "de", "ko"). |
| 16 | `genre_tmdb` | ARRAY | Genres from TMDB (e.g. ["Drama", "Thriller"]). Use LATERAL FLATTEN. |
| 17 | `production_countries` | ARRAY | ISO 3166-1 country codes (e.g. ["US", "GB"]). Use LATERAL FLATTEN. |
| 18 | `production_budget` | NUMBER | Production budget in USD. Null for many titles. |
| 19 | `seasons` | NUMBER | Total seasons. Shows only. |
| 20 | `season_number` | NUMBER | Season number. Seasons and episodes only. |
| 21 | `episodes` | NUMBER | Total episodes in show or season. |
| 22 | `episode_number` | NUMBER | Episode number within season. Episodes only. |
| 23 | `episodes_per_season` | NUMBER | Episodes in this season. Seasons only. |
| 24 | `imdb_score` | NUMBER | IMDB user rating (0.0–10.0). May be null. |
| 25 | `scoring` | OBJECT | JustWatch scoring. Key: `scoring:score_imdb_votes::NUMBER`. |
| 26 | `id_imdb` | VARCHAR | IMDB ID (e.g. "tt0120737"). |
| 27 | `id_tmdb` | VARCHAR | TMDB identifier. |
| 28 | `url_imdb` | VARCHAR | Full IMDB URL. |
| 29 | `url_tmdb` | VARCHAR | Full TMDB URL. |
| 30 | `talent_cast` | ARRAY | Cast names (e.g. ["Meryl Streep", "Tom Hanks"]). Use LATERAL FLATTEN. |
| 31 | `talent_director` | ARRAY | Director names. Use LATERAL FLATTEN. |
| 32 | `talent_writer` | ARRAY | Writer names. Use LATERAL FLATTEN. |
| 33 | `studios` | OBJECT | Production studios. Key: `studios:name::TEXT`. |
| 34 | `poster_jw` | VARCHAR | JustWatch poster image URL. |
| 35 | `trailers` | ARRAY | Trailer objects with YouTube URLs. May be null. |
