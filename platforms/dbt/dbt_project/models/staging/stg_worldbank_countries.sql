-- Pure source mirror of WORLDBANK_INDICATORS.
-- Business logic (indicator/country label lookups, metadata join) has moved to int_worldbank_enriched.
with source as (
    select * from {{ source('raw', 'WORLDBANK_INDICATORS') }}
),

staged as (
    select
        series_id,
        obs_date,
        value
    from source
)

select * from staged
