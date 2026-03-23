with monthly_raw as (
    select
        date_trunc('month', obs_date)::date as obs_month,
        max(case when series_id = 'MSPUS' then value end) as median_home_price,
        max(case when series_id = 'CSUSHPISA' then value end) as home_price_index,
        avg(case when series_id = 'MORTGAGE30US' then value end) as mortgage_rate,
        max(case when series_id = 'CUSR0000SEHA' then value end) as rent_index,
        max(case when series_id = 'HOUST' then value end) as housing_starts,
        max(case when series_id = 'MEHOINUSA672N' then value end) as median_income_annual
    from {{ ref('int_fred_topic_classified') }}
    where topic in ('housing', 'income', 'debt')
    group by 1
),

filled as (
    select
        obs_month,
        last_value(median_home_price ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as median_home_price,
        home_price_index,
        last_value(mortgage_rate ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as mortgage_rate,
        rent_index,
        housing_starts,
        last_value(median_income_annual ignore nulls) over (order by obs_month rows between unbounded preceding and current row) as median_income_annual
    from monthly_raw
),

computed as (
    select
        *,
        case
            when mortgage_rate > 0 and median_home_price > 0 then
                round(
                    (median_home_price * 0.8) * (mortgage_rate / 1200) *
                    pow(1 + mortgage_rate / 1200, 360) /
                    nullif(pow(1 + mortgage_rate / 1200, 360) - 1, 0),
                    0
                )
        end as monthly_mortgage_payment,
        round(median_home_price / nullif(median_income_annual, 0), 2) as home_price_to_income_ratio,
        round((rent_index / nullif(lag(rent_index, 12) over (order by obs_month), 0) - 1) * 100, 2) as rent_yoy
    from filled
)

select
    obs_month,
    median_home_price,
    home_price_index,
    mortgage_rate,
    rent_index,
    housing_starts,
    median_income_annual,
    monthly_mortgage_payment,
    home_price_to_income_ratio,
    round(monthly_mortgage_payment / nullif(median_income_annual / 12, 0) * 100, 1) as mortgage_pct_of_income,
    rent_yoy
from computed
where median_home_price is not null or mortgage_rate is not null
