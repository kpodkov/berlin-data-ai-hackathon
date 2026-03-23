-- FRED time series observations | 31 series | DB_TEAM_3.RAW.FRED_OBSERVATIONS
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per (series_id, obs_date).
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('raw', 'FRED_OBSERVATIONS') }}
),

bronze as (
    select
        -- identity
        series_id,
        obs_date,

        -- value (NULL = missing observation in FRED, stored as '.' in raw)
        value,

        -- audit metadata
        'fred'              as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
