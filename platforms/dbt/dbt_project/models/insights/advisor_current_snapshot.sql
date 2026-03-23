{{ config(materialized='view') }}

with inflation_latest as (
    select obs_month, cpi_all_yoy, cpi_food_yoy, cpi_energy_yoy, cpi_medical_yoy, cpi_rent_yoy, purchasing_power_index
    from {{ ref('mart_inflation_impact') }}
    where cpi_all_yoy is not null
    qualify row_number() over (order by obs_month desc) = 1
),

housing_latest as (
    select obs_month, median_home_price, mortgage_rate, monthly_mortgage_payment, home_price_to_income_ratio, mortgage_pct_of_income
    from {{ ref('mart_housing_affordability') }}
    where monthly_mortgage_payment is not null
    qualify row_number() over (order by obs_month desc) = 1
),

savings_latest as (
    select obs_month, savings_rate, fed_funds_rate, real_fed_funds, real_treasury_10y, cpi_yoy
    from {{ ref('mart_savings_health') }}
    where cpi_yoy is not null
    qualify row_number() over (order by obs_month desc) = 1
),

debt_latest as (
    select obs_month, mortgage_rate, credit_card_rate, credit_card_spread, debt_service_ratio, revolving_pct_of_total, total_credit_yoy
    from {{ ref('mart_debt_burden') }}
    where credit_card_rate is not null
    qualify row_number() over (order by obs_month desc) = 1
),

investment_latest as (
    select
        max(case when series_id = 'SPY' then rolling_12m_return_pct end) as spy_12m_return,
        max(case when series_id = 'AGG' then rolling_12m_return_pct end) as agg_12m_return,
        max(case when series_id = 'GLD' then rolling_12m_return_pct end) as gld_12m_return,
        max(case when series_id = 'BTC-USD' then rolling_12m_return_pct end) as btc_12m_return,
        max(vix_monthly_avg) as vix_latest
    from {{ ref('mart_investment_performance') }}
    where month_key = (select max(month_key) from {{ ref('mart_investment_performance') }} where series_id = 'SPY')
),

global_us as (
    select gdp_per_capita, inflation_rate as global_us_inflation, unemployment_rate as global_us_unemployment, gini_index, savings_rate as global_us_savings
    from {{ ref('mart_global_comparison') }}
    where country_code = 'USA'
    qualify row_number() over (order by obs_year desc) = 1
)

select
    -- inflation
    i.cpi_all_yoy,
    i.cpi_food_yoy,
    i.cpi_energy_yoy,
    i.cpi_medical_yoy,
    i.cpi_rent_yoy,
    i.purchasing_power_index,
    -- housing
    h.median_home_price,
    h.mortgage_rate as housing_mortgage_rate,
    h.monthly_mortgage_payment,
    h.home_price_to_income_ratio,
    h.mortgage_pct_of_income,
    -- savings
    s.savings_rate,
    s.fed_funds_rate,
    s.real_fed_funds,
    s.real_treasury_10y,
    -- debt
    d.credit_card_rate,
    d.credit_card_spread,
    d.debt_service_ratio,
    d.revolving_pct_of_total,
    d.total_credit_yoy,
    -- investments
    inv.spy_12m_return,
    inv.agg_12m_return,
    inv.gld_12m_return,
    inv.btc_12m_return,
    inv.vix_latest,
    -- global
    g.gdp_per_capita,
    g.gini_index,
    g.global_us_savings
from inflation_latest i
cross join housing_latest h
cross join savings_latest s
cross join debt_latest d
cross join investment_latest inv
cross join global_us g
