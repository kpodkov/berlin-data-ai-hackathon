-- Personal financial planning scenarios.
-- Grain: one row per (age_group, risk_profile, savings_monthly, horizon_years).
-- Pre-computes portfolio allocation, projected wealth, and personalized guidance
-- using historical asset returns from int_asset_returns and current macro from mart_market_environment.
--
-- Dashboard users filter by their age group, risk tolerance, and monthly savings
-- to see personalized projections and action items.

{{ config(materialized='table', schema='marts') }}

-- ---------------------------------------------------------------------------
-- 1. Historical annualized returns per asset class proxy
-- ---------------------------------------------------------------------------
with asset_stats as (
    select
        series_id,
        avg(monthly_return) * 12          as annual_return,
        stddev(monthly_return) * sqrt(12)  as annual_vol
    from {{ ref('int_asset_returns') }}
    where monthly_return is not null
      and series_id in ('SPY', 'AGG', 'GLD', 'VNQ')
    group by 1
),

returns as (
    select
        max(case when series_id = 'SPY' then annual_return end) as equity_ret,
        max(case when series_id = 'SPY' then annual_vol    end) as equity_vol,
        max(case when series_id = 'AGG' then annual_return end) as bond_ret,
        max(case when series_id = 'AGG' then annual_vol    end) as bond_vol,
        max(case when series_id = 'GLD' then annual_return end) as gold_ret,
        max(case when series_id = 'GLD' then annual_vol    end) as gold_vol,
        max(case when series_id = 'VNQ' then annual_return end) as reit_ret,
        max(case when series_id = 'VNQ' then annual_vol    end) as reit_vol
    from asset_stats
),

-- ---------------------------------------------------------------------------
-- 2. Current macro snapshot (single row)
-- ---------------------------------------------------------------------------
macro as (
    select
        max(overall_environment)    as market_verdict,
        max(overall_traffic_light)  as market_signal,
        max(green_count)            as green_signals,
        max(red_count)              as red_signals,
        max(as_of_period)           as data_as_of
    from {{ ref('mart_market_environment') }}
),

-- Latest inflation & rates
latest_inflation as (
    select cpi_all_yoy
    from {{ ref('mart_inflation_impact') }}
    where cpi_all_yoy is not null
    order by obs_month desc
    limit 1
),

latest_rates as (
    select mortgage_rate, credit_card_rate, debt_service_ratio
    from {{ ref('mart_debt_burden') }}
    where mortgage_rate is not null
    order by obs_month desc
    limit 1
),

-- ---------------------------------------------------------------------------
-- 3. User profile dimensions (static lookup)
-- ---------------------------------------------------------------------------
age_groups as (
    select column1 as age_group, column2 as retirement_years, column3 as life_stage
    from values
        ('18-25', 40, 'Early career — maximize growth, start building habits'),
        ('26-35', 32, 'Building wealth — increase savings rate, manage student debt'),
        ('36-45', 22, 'Peak earnings — balance growth with family security'),
        ('46-55', 12, 'Pre-retirement — shift toward preservation'),
        ('56-65',  5, 'Near retirement — prioritize income and safety'),
        ('65+',    0, 'Retirement — protect capital, generate income')
),

risk_profiles as (
    select
        column1 as risk_profile,
        column2 as equity_pct,
        column3 as bond_pct,
        column4 as gold_pct,
        column5 as reit_pct,
        column6 as risk_description
    from values
        ('Conservative',  0.25, 0.55, 0.10, 0.10, 'Low volatility — capital preservation focus'),
        ('Moderate',      0.50, 0.30, 0.10, 0.10, 'Balanced — growth with downside protection'),
        ('Aggressive',    0.80, 0.05, 0.05, 0.10, 'High growth — can tolerate large drawdowns')
),

savings_levels as (
    select column1 as savings_monthly, column2 as savings_label
    from values
        (100,  '$100/mo'),
        (250,  '$250/mo'),
        (500,  '$500/mo'),
        (1000, '$1,000/mo'),
        (2000, '$2,000/mo'),
        (5000, '$5,000/mo')
),

horizons as (
    select column1 as horizon_years
    from values (5), (10), (15), (20), (25), (30)
),

-- ---------------------------------------------------------------------------
-- 4. Cross-join all dimensions and compute projections
-- ---------------------------------------------------------------------------
scenarios as (
    select
        a.age_group,
        a.retirement_years,
        a.life_stage,
        r.risk_profile,
        r.equity_pct,
        r.bond_pct,
        r.gold_pct,
        r.reit_pct,
        r.risk_description,
        s.savings_monthly,
        s.savings_label,
        h.horizon_years,

        -- Weighted portfolio expected return
        round((
            r.equity_pct * ret.equity_ret
          + r.bond_pct  * ret.bond_ret
          + r.gold_pct  * ret.gold_ret
          + r.reit_pct  * ret.reit_ret
        ) * 100, 1)                                             as expected_return_pct,

        -- Weighted portfolio volatility (simplified — ignores correlations)
        round(sqrt(
            pow(r.equity_pct * ret.equity_vol, 2)
          + pow(r.bond_pct  * ret.bond_vol, 2)
          + pow(r.gold_pct  * ret.gold_vol, 2)
          + pow(r.reit_pct  * ret.reit_vol, 2)
        ) * 100, 1)                                             as expected_vol_pct,

        -- Future value of annuity: PMT * ((1+r)^n - 1) / r
        -- where r = monthly rate, n = months, PMT = monthly savings
        round(
            s.savings_monthly
            * (pow(1 + (r.equity_pct * ret.equity_ret
                      + r.bond_pct  * ret.bond_ret
                      + r.gold_pct  * ret.gold_ret
                      + r.reit_pct  * ret.reit_ret) / 12,
                   h.horizon_years * 12) - 1)
            / nullif((r.equity_pct * ret.equity_ret
                    + r.bond_pct  * ret.bond_ret
                    + r.gold_pct  * ret.gold_ret
                    + r.reit_pct  * ret.reit_ret) / 12, 0),
            0
        )                                                       as projected_wealth,

        -- Total contributions (no returns)
        s.savings_monthly * h.horizon_years * 12                as total_contributed,

        -- Inflation-adjusted projected wealth
        round(
            s.savings_monthly
            * (pow(1 + (r.equity_pct * ret.equity_ret
                      + r.bond_pct  * ret.bond_ret
                      + r.gold_pct  * ret.gold_ret
                      + r.reit_pct  * ret.reit_ret) / 12,
                   h.horizon_years * 12) - 1)
            / nullif((r.equity_pct * ret.equity_ret
                    + r.bond_pct  * ret.bond_ret
                    + r.gold_pct  * ret.gold_ret
                    + r.reit_pct  * ret.reit_ret) / 12, 0)
            / pow(1 + coalesce(inf.cpi_all_yoy, 3.0) / 100, h.horizon_years),
            0
        )                                                       as projected_wealth_real,

        -- Macro context
        m.market_verdict,
        m.market_signal,
        m.data_as_of,
        coalesce(inf.cpi_all_yoy, 0)                           as current_inflation_pct,
        coalesce(lr.mortgage_rate, 0)                           as current_mortgage_rate,
        coalesce(lr.credit_card_rate, 0)                        as current_cc_rate,

        -- Personalized action based on age + risk + macro
        case
            when m.market_signal = 'red' and r.risk_profile = 'Aggressive'
                then 'Market stressed — consider reducing equity allocation temporarily'
            when m.market_signal = 'red' and a.retirement_years <= 5
                then 'Caution — protect near-retirement savings, shift to bonds'
            when m.market_signal = 'green' and a.retirement_years > 20
                then 'Favorable conditions — stay invested, consider increasing equity'
            when m.market_signal = 'green' and r.risk_profile = 'Conservative'
                then 'Market is favorable — good time to stay the course'
            when coalesce(inf.cpi_all_yoy, 0) > 4
                then 'High inflation — consider TIPS or real assets to protect purchasing power'
            when coalesce(lr.mortgage_rate, 0) < 5 and a.age_group in ('26-35', '36-45')
                then 'Mortgage rates are low — favorable for home purchase if planned'
            else 'Stay diversified and keep saving consistently'
        end                                                     as personalized_action,

        'Illustrative only — not investment advice.'            as disclaimer

    from age_groups a
    cross join risk_profiles r
    cross join savings_levels s
    cross join horizons h
    cross join returns ret
    cross join macro m
    cross join latest_inflation inf
    cross join latest_rates lr
)

select * from scenarios
