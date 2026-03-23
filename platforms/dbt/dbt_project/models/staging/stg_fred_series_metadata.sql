with source as (
    select * from {{ source('raw', 'FRED_SERIES_METADATA') }}
),

staged as (
    select
        series_id,
        title,
        units,
        frequency,
        category,
        'fred'              as _source,
        current_timestamp() as _loaded_at
    from source
)

select * from staged
