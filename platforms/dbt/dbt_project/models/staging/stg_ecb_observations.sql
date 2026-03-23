with source as (
    select * from {{ source('raw', 'ECB_OBSERVATIONS') }}
),

staged as (
    select
        series_id,
        obs_date,
        cast(value as number(38, 8)) as value,
        'ecb'               as _source,
        current_timestamp() as _loaded_at
    from source
)

select * from staged
