with monthly_fred as (
    select
        date_trunc('month', obs_date)::date as obs_month,
        max(case when series_id = 'PSAVERT' then value end) as savings_rate,
        max(case when series_id = 'SAVINGSL' then value end) as savings_level,
        max(case when series_id = 'FEDFUNDS' then value end) as fed_funds_rate,
        max(case when series_id = 'CPIAUCSL' then value end) as cpi_index
    from {{ ref('int_fred_topic_classified') }}
    where topic in ('savings', 'rates', 'cpi')
    group by 1
),

dgs10_monthly as (
    select
        date_trunc('month', obs_date)::date as obs_month,
        round(avg(value), 2) as treasury_10y
    from {{ ref('int_fred_topic_classified') }}
    where series_id = 'DGS10'
    group by 1
),

joined as (
    select
        f.obs_month,
        f.savings_rate,
        f.savings_level,
        f.fed_funds_rate,
        d.treasury_10y,
        f.cpi_index,
        round((f.cpi_index / nullif(lag(f.cpi_index, 12) over (order by f.obs_month), 0) - 1) * 100, 2) as cpi_yoy
    from monthly_fred f
    left join dgs10_monthly d on f.obs_month = d.obs_month
    where f.savings_rate is not null
)

select
    obs_month,
    savings_rate,
    savings_level,
    fed_funds_rate,
    treasury_10y,
    cpi_index,
    cpi_yoy,
    round(fed_funds_rate - cpi_yoy, 2) as real_fed_funds,
    round(treasury_10y - cpi_yoy, 2) as real_treasury_10y
from joined
