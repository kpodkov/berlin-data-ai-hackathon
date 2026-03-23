-- FRED series catalogue | DB_TEAM_3.RAW.FRED_SERIES_METADATA
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per series_id. Casts last_updated to TIMESTAMP_NTZ for consistent typing.
-- See _fred_sources.yml for full column descriptions.
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('team_raw', 'FRED_SERIES_METADATA') }}
),

bronze as (
    select
        -- identity
        series_id,

        -- descriptive attributes
        title,
        units,
        frequency,
        seasonal_adjustment,
        last_updated::timestamp_ntz as last_updated_at,
        category,

        -- audit metadata
        'fred'              as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
