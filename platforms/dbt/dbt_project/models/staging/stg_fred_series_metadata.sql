-- FRED series catalogue | DB_TEAM_3.RAW.FRED_SERIES_METADATA
-- Staging layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per series_id. Casts last_updated to TIMESTAMP_NTZ for consistent typing.
with source as (
    select * from {{ source('raw', 'FRED_SERIES_METADATA') }}
),

staged as (
    select
        series_id,
        title,
        units,
        frequency,
        seasonal_adjustment,
        last_updated::timestamp_ntz as last_updated_at,
        category,
        'fred'              as _source,
        current_timestamp() as _loaded_at
    from source
)

select * from staged
