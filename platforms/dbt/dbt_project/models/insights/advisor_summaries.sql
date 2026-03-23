{{ config(materialized='table') }}

with snapshot as (
    select * from {{ ref('advisor_current_snapshot') }}
),

inflation_summary as (
    select
        'inflation' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences about current US inflation based on this data. Be specific with numbers. No jargon.\n\n' ||
            'Overall inflation: ' || coalesce(cpi_all_yoy::varchar, 'N/A') || '% year-over-year\n' ||
            'Food prices: ' || coalesce(cpi_food_yoy::varchar, 'N/A') || '% YoY\n' ||
            'Energy prices: ' || coalesce(cpi_energy_yoy::varchar, 'N/A') || '% YoY\n' ||
            'Medical costs: ' || coalesce(cpi_medical_yoy::varchar, 'N/A') || '% YoY\n' ||
            'Rent: ' || coalesce(cpi_rent_yoy::varchar, 'N/A') || '% YoY\n' ||
            'Purchasing power index (100 = start): ' || coalesce(purchasing_power_index::varchar, 'N/A')
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

housing_summary as (
    select
        'housing' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences about US housing affordability based on this data. Be specific with numbers. No jargon.\n\n' ||
            'Median home price: $' || coalesce(median_home_price::varchar, 'N/A') || '\n' ||
            'Mortgage rate (30-year): ' || coalesce(housing_mortgage_rate::varchar, 'N/A') || '%\n' ||
            'Monthly mortgage payment (20% down): $' || coalesce(monthly_mortgage_payment::varchar, 'N/A') || '\n' ||
            'Home price to income ratio: ' || coalesce(home_price_to_income_ratio::varchar, 'N/A') || 'x\n' ||
            'Mortgage as percent of income: ' || coalesce(mortgage_pct_of_income::varchar, 'N/A') || '%'
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

savings_summary as (
    select
        'savings' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences about US savings based on this data. Be specific with numbers. No jargon.\n\n' ||
            'Personal savings rate: ' || coalesce(savings_rate::varchar, 'N/A') || '%\n' ||
            'Fed funds rate: ' || coalesce(fed_funds_rate::varchar, 'N/A') || '%\n' ||
            'Real return on savings (after inflation): ' || coalesce(real_fed_funds::varchar, 'N/A') || '%\n' ||
            'Real 10-year Treasury yield: ' || coalesce(real_treasury_10y::varchar, 'N/A') || '%'
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

debt_summary as (
    select
        'debt' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences about US consumer debt based on this data. Be specific with numbers. No jargon.\n\n' ||
            'Credit card interest rate: ' || coalesce(credit_card_rate::varchar, 'N/A') || '%\n' ||
            'Credit card spread over fed rate: ' || coalesce(credit_card_spread::varchar, 'N/A') || ' points\n' ||
            'Household debt service ratio: ' || coalesce(debt_service_ratio::varchar, 'N/A') || '%\n' ||
            'Consumer credit growth: ' || coalesce(total_credit_yoy::varchar, 'N/A') || '% YoY'
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

investment_summary as (
    select
        'investments' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences about investment performance based on this data. Be specific with numbers. No jargon.\n\n' ||
            'S&P 500 trailing 12-month return: ' || coalesce(spy_12m_return::varchar, 'N/A') || '%\n' ||
            'Bond index (AGG) 12-month return: ' || coalesce(agg_12m_return::varchar, 'N/A') || '%\n' ||
            'Gold 12-month return: ' || coalesce(gld_12m_return::varchar, 'N/A') || '%\n' ||
            'Bitcoin 12-month return: ' || coalesce(btc_12m_return::varchar, 'N/A') || '%\n' ||
            'VIX (fear gauge): ' || coalesce(vix_latest::varchar, 'N/A')
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

global_summary as (
    select
        'global' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor speaking to a regular person. Write exactly 3 short sentences comparing the US economy globally based on this data. Be specific with numbers. No jargon.\n\n' ||
            'US GDP per capita (PPP): $' || coalesce(gdp_per_capita::varchar, 'N/A') || '\n' ||
            'US Gini index (inequality): ' || coalesce(gini_index::varchar, 'N/A') || '\n' ||
            'US gross savings rate: ' || coalesce(global_us_savings::varchar, 'N/A') || '%'
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
),

headline as (
    select
        'headline' as topic,
        snowflake.cortex.complete('llama3.1-70b',
            'You are a friendly personal finance advisor. Write exactly 3 sentences summarizing the overall state of American personal finances for a regular person. Be specific with key numbers. No jargon.\n\n' ||
            'Inflation: ' || coalesce(cpi_all_yoy::varchar, 'N/A') || '% overall\n' ||
            'Median home: $' || coalesce(median_home_price::varchar, 'N/A') || ' at ' || coalesce(housing_mortgage_rate::varchar, 'N/A') || '% rate\n' ||
            'Savings rate: ' || coalesce(savings_rate::varchar, 'N/A') || '%\n' ||
            'Credit card rate: ' || coalesce(credit_card_rate::varchar, 'N/A') || '%\n' ||
            'S&P 500 12-month return: ' || coalesce(spy_12m_return::varchar, 'N/A') || '%'
        ) as summary_text,
        current_timestamp() as generated_at
    from snapshot
)

select * from inflation_summary
union all select * from housing_summary
union all select * from savings_summary
union all select * from debt_summary
union all select * from investment_summary
union all select * from global_summary
union all select * from headline
