-- World Bank annual indicators | 150 series × 25 years | DB_TEAM_3.RAW.WORLDBANK_INDICATORS
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per (series_id, obs_date). obs_date is always Jan 1 of the reference year.
-- Covers 15 countries × 10 socioeconomic indicators, years 2000–2024.
-- See _worldbank_sources.yml for full indicator and country coverage.
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('raw', 'WORLDBANK_INDICATORS') }}
),

bronze as (
    select
        -- identity
        series_id,
        obs_date,

        -- parsed compound key components for convenient downstream use
        -- series_id format: {INDICATOR_CODE}_{ISO3_COUNTRY_CODE} (split on last underscore)
        regexp_substr(series_id, '^(.+)_[A-Z]{3}$', 1, 1, 'e', 1) as indicator_code,
        right(series_id, 3)                                         as country_iso3,
        year(obs_date)                                              as reference_year,

        -- value (NULL = no data available for this country-year)
        value,

        -- audit metadata
        'world_bank'        as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
