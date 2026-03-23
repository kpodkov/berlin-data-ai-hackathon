-- Pure source mirror of MARKET_PRICES.
-- Business logic (asset_class classification, daily_return LAG, metadata join) has
-- moved to int_market_daily_returns.
with source as (
    select * from {{ source('raw', 'MARKET_PRICES') }}
),

staged as (
    select
        series_id,
        obs_date,
        value
    from source
)

select * from staged
