-- FRED time series observations | DB_TEAM_3.RAW.FRED_OBSERVATIONS
-- Staging layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per (series_id, obs_date). No value transformations — NULLs preserved as-is.
with source as (
    select * from {{ source('raw', 'FRED_OBSERVATIONS') }}
),

staged as (
    select
        series_id,
        obs_date,
        value,
        'fred'              as _source,
        current_timestamp() as _loaded_at
    from source
)

select * from staged
