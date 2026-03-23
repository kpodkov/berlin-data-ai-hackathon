-- FRED series metadata | 31 series | DB_TEAM_3.RAW.FRED_METADATA
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per series_id.
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('raw', 'FRED_SERIES_METADATA') }}
),

bronze as (
    select
        -- identity
        series_id,

        -- descriptive metadata
        title,
        units,
        frequency,
        category,

        -- audit metadata
        'fred'              as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
