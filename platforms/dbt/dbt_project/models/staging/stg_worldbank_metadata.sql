-- World Bank indicator catalogue | 150 series (10 indicators × 15 countries) | DB_TEAM_3.RAW.WORLDBANK_METADATA
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per series_id ({INDICATOR_CODE}_{ISO3}). Join to stg_worldbank_indicators on series_id.
-- See _worldbank_sources.yml for full indicator and country coverage.
{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'WORLDBANK_METADATA') }}
),

bronze as (
    select
        -- identity
        series_id,

        -- parsed compound key components for convenient downstream use
        -- series_id format: {INDICATOR_CODE}_{ISO3_COUNTRY_CODE} (split on last underscore)
        regexp_substr(series_id, '^(.+)_[A-Z]{3}$', 1, 1, 'e', 1) as indicator_code,
        right(series_id, 3)                                         as country_iso3,

        -- descriptive attributes
        title,
        units,
        frequency,
        source,

        -- audit metadata
        'world_bank'        as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
