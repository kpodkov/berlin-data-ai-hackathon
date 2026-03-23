-- FRED time series observations | DB_TEAM_3.RAW.FRED_OBSERVATIONS
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per (series_id, obs_date). No value transformations — NULLs preserved as-is.
-- See _fred_sources.yml for full column descriptions.
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('team_raw', 'FRED_OBSERVATIONS') }}
),

bronze as (
    select
        -- identity (composite primary key)
        series_id,
        obs_date,

        -- observation value (units vary by series — see base_fred_series_metadata)
        value,

        -- audit metadata
        'fred'              as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
