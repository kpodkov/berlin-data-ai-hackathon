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
