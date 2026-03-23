{{ config(materialized='table', schema='intermediate') }}

with

observations as (
    select
        series_id,
        obs_date,
        value
    from {{ ref('stg_ecb_observations') }}
    where value is not null
),

metadata as (
    select
        series_id,
        title,
        units,
        category
    from {{ ref('stg_ecb_metadata') }}
),

monthly as (
    select
        obs.series_id,
        date_trunc('month', obs.obs_date)::date as month_date,
        meta.title,
        meta.units,
        meta.category,
        obs.value
    from observations as obs
    left join metadata as meta
        on obs.series_id = meta.series_id
    qualify row_number() over (
        partition by obs.series_id, date_trunc('month', obs.obs_date)
        order by obs.obs_date desc
    ) = 1
),

with_yoy as (
    select
        series_id,
        month_date,
        title,
        units,
        category,
        value,
        lag(value, 12) over (
            partition by series_id
            order by month_date
        ) as value_12m_ago,
        round(
            (value - lag(value, 12) over (partition by series_id order by month_date))
            / nullif(lag(value, 12) over (partition by series_id order by month_date), 0)
            * 100,
            2
        ) as yoy_change_pct
    from monthly
)

select
    series_id,
    month_date,
    title,
    units,
    category,
    value,
    value_12m_ago,
    yoy_change_pct,
    case
        when yoy_change_pct > 2 then 'EUR Strengthening'
        when yoy_change_pct < -2 then 'EUR Weakening'
        else 'Stable'
    end as trend_direction
from with_yoy
