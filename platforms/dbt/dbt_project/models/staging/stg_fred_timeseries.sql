-- Pure source mirror of FRED_OBSERVATIONS.
-- Business logic (topic classification, metadata join) has moved to int_fred_topic_classified.
-- Kept as a passthrough alias for backward compatibility during the transition.
with source as (
    select * from {{ source('raw', 'FRED_OBSERVATIONS') }}
),

staged as (
    select
        series_id,
        obs_date,
        value
    from source
)

select * from staged
