with source as (
    select * from {{ source('raw', 'ECB_METADATA') }}
),

staged as (
    select
        series_id,
        title,
        units,
        frequency,
        category,
        'ecb'               as _source,
        current_timestamp() as _loaded_at
    from source
)

select * from staged
