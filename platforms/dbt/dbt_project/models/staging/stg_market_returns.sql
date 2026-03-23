with prices as (
    select * from {{ source('raw', 'MARKET_PRICES') }}
),

metadata as (
    select * from {{ source('raw', 'MARKET_METADATA') }}
),

final as (
    select
        p.series_id,
        p.obs_date,
        p.value,
        m.title,
        case
            when p.series_id in ('SPY', 'QQQ', 'VEA', 'VWO') then 'equity'
            when p.series_id in ('AGG', 'TLT', 'TIP') then 'bond'
            when p.series_id in ('GLD', 'XLE') then 'commodity'
            when p.series_id in ('BTC-USD', 'ETH-USD') then 'crypto'
            when p.series_id = 'VNQ' then 'real_estate'
            when p.series_id = 'DX-Y.NYB' then 'currency'
            else 'other'
        end as asset_class,
        (p.value / lag(p.value) over (partition by p.series_id order by p.obs_date)) - 1 as daily_return,
        date_trunc('month', p.obs_date) as month_key
    from prices p
    left join metadata m on p.series_id = m.series_id
)

select * from final
