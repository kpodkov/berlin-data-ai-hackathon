with monthly_closes as (
    select
        series_id,
        title,
        asset_class,
        month_key,
        last_value(value) over (
            partition by series_id, month_key
            order by obs_date
            rows between unbounded preceding and unbounded following
        ) as monthly_close,
        row_number() over (
            partition by series_id, month_key
            order by obs_date desc
        ) as rn
    from {{ ref('int_market_daily_returns') }}
),

deduped as (
    select * from monthly_closes where rn = 1
),

monthly_cpi as (
    select
        date_trunc('month', obs_date)::date as month_key,
        value as cpi_index
    from {{ ref('int_fred_topic_classified') }}
    where series_id = 'CPIAUCSL'
),

vix_monthly as (
    select
        date_trunc('month', obs_date)::date as month_key,
        round(avg(value), 2) as vix_monthly_avg
    from {{ ref('int_fred_topic_classified') }}
    where series_id = 'VIXCLS'
    group by 1
),

with_returns as (
    select
        d.series_id,
        d.title,
        d.asset_class,
        d.month_key,
        d.monthly_close,
        (d.monthly_close / nullif(lag(d.monthly_close) over (partition by d.series_id order by d.month_key), 0)) - 1 as monthly_return,
        (c.cpi_index / nullif(lag(c.cpi_index) over (order by d.month_key), 0)) - 1 as monthly_inflation,
        v.vix_monthly_avg
    from deduped d
    left join monthly_cpi c on d.month_key = c.month_key
    left join vix_monthly v on d.month_key = v.month_key
),

with_cumulative as (
    select
        *,
        monthly_return - monthly_inflation as real_monthly_return,
        exp(sum(ln(1 + nullif(monthly_return, 0))) over (partition by series_id order by month_key)) as cumulative_return,
        exp(sum(ln(1 + nullif(monthly_return - monthly_inflation, 0))) over (partition by series_id order by month_key)) as cumulative_real_return,
        exp(sum(ln(1 + nullif(monthly_return, 0))) over (partition by series_id order by month_key rows between 11 preceding and current row)) - 1 as rolling_12m_return
    from with_returns
    where monthly_return is not null
)

select
    series_id,
    title,
    asset_class,
    month_key,
    round(monthly_close, 2) as monthly_close,
    round(monthly_return * 100, 2) as monthly_return_pct,
    round(real_monthly_return * 100, 2) as real_monthly_return_pct,
    round((cumulative_return - 1) * 100, 2) as cumulative_return_pct,
    round((cumulative_real_return - 1) * 100, 2) as cumulative_real_return_pct,
    round((cumulative_return / nullif(max(cumulative_return) over (partition by series_id order by month_key rows between unbounded preceding and current row), 0) - 1) * 100, 2) as drawdown_pct,
    round(rolling_12m_return * 100, 2) as rolling_12m_return_pct,
    vix_monthly_avg
from with_cumulative
