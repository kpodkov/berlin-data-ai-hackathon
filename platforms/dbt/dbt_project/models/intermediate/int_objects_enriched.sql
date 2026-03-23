-- Grain: one row per top-level title (movie or show)
-- Filters base_objects to top-level titles only (title_id = object_id).
-- Exposes all metadata columns needed by mart models.
--
-- Used by: fct_segment_title_demand, fct_title_seasonality,
--          fct_genre_demand_profile, fct_title_licensing_score
{{ config(materialized='view') }}

select
    object_id,
    object_type,
    title_id,
    parent_id,
    show_season_id,

    title,
    original_title,
    translated_title,
    short_description,

    release_year,
    release_date,
    runtime,
    original_language,

    genre_tmdb,
    production_countries,
    talent_cast,
    talent_director,
    talent_writer,

    production_budget,
    imdb_score,
    scoring,
    imdb_votes,

    seasons,
    season_number,
    episodes,
    episode_number,
    episodes_per_season,

    id_imdb,
    id_tmdb,
    url_imdb,
    url_tmdb,

    studios,

    poster_jw,
    trailers

from {{ ref('base_objects') }}
where title_id = object_id      -- top-level titles only (movies and shows, not seasons/episodes)
