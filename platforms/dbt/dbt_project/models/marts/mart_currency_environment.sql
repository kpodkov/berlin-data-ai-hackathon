{{ config(materialized='table', schema='marts') }}

with

exchange_rates as (
    select
        series_id,
        title,
        category,
        month_date,
        value,
        yoy_change_pct,
        trend_direction
    from {{ ref('int_ecb_exchange_rates') }}
),

latest as (
    select
        series_id,
        title,
        category,
        month_date,
        value,
        yoy_change_pct,
        trend_direction
    from exchange_rates
    qualify row_number() over (partition by series_id order by month_date desc) = 1
)

select
    series_id,
    title,
    category,
    month_date,
    to_char(month_date, 'YYYY-MM') as as_of_period,
    value,
    yoy_change_pct,
    trend_direction,
    case
        when trend_direction = 'EUR Strengthening' then 'green'
        when trend_direction = 'EUR Weakening' then 'red'
        else 'yellow'
    end as signal_color,
    current_timestamp() as _loaded_at
from latest
