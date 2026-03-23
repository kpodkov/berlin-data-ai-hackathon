with monthly_raw as (
    select
        date_trunc('month', obs_date)::date as obs_month,
        avg(case when series_id = 'MORTGAGE30US' then value end) as mortgage_rate,
        max(case when series_id = 'TERMCBCCALLNS' then value end) as credit_card_rate,
        max(case when series_id = 'FEDFUNDS' then value end) as fed_funds_rate,
        max(case when series_id = 'TOTALSL' then value end) as total_credit,
        max(case when series_id = 'REVOLSL' then value end) as revolving_credit,
        max(case when series_id = 'NONREVSL' then value end) as nonrevolving_credit,
        max(case when series_id = 'TDSP' then value end) as debt_service_ratio
    from {{ ref('stg_fred_timeseries') }}
    where topic in ('debt', 'rates')
    group by 1
),

filled as (
    select
        obs_month,
        last_value(mortgage_rate ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as mortgage_rate,
        last_value(credit_card_rate ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as credit_card_rate,
        fed_funds_rate,
        total_credit,
        revolving_credit,
        nonrevolving_credit,
        last_value(debt_service_ratio ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as debt_service_ratio
    from monthly_raw
)

select
    obs_month,
    mortgage_rate,
    credit_card_rate,
    fed_funds_rate,
    round(credit_card_rate - fed_funds_rate, 2) as credit_card_spread,
    total_credit,
    revolving_credit,
    nonrevolving_credit,
    round(revolving_credit / nullif(total_credit, 0) * 100, 1) as revolving_pct_of_total,
    debt_service_ratio,
    round((total_credit / nullif(lag(total_credit, 12) over (order by obs_month), 0) - 1) * 100, 2) as total_credit_yoy
from filled
where fed_funds_rate is not null
