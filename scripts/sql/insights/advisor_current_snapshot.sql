USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;
CREATE SCHEMA IF NOT EXISTS INSIGHTS;

CREATE OR REPLACE VIEW INSIGHTS.advisor_current_snapshot AS

-- Inflation metrics
SELECT
    'inflation'                                            AS topic,
    'Overall CPI YoY'                                      AS metric_name,
    ROUND(cpi_all_yoy, 1)::VARCHAR || '%'                  AS metric_value
FROM MARTS.mart_inflation_impact
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_inflation_impact WHERE cpi_all_yoy IS NOT NULL)

UNION ALL

SELECT
    'inflation',
    'Food CPI YoY',
    ROUND(cpi_food_yoy, 1)::VARCHAR || '%'
FROM MARTS.mart_inflation_impact
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_inflation_impact WHERE cpi_food_yoy IS NOT NULL)

UNION ALL

SELECT
    'inflation',
    'Energy CPI YoY',
    ROUND(cpi_energy_yoy, 1)::VARCHAR || '%'
FROM MARTS.mart_inflation_impact
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_inflation_impact WHERE cpi_energy_yoy IS NOT NULL)

UNION ALL

SELECT
    'inflation',
    'Medical CPI YoY',
    ROUND(cpi_medical_yoy, 1)::VARCHAR || '%'
FROM MARTS.mart_inflation_impact
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_inflation_impact WHERE cpi_medical_yoy IS NOT NULL)

UNION ALL

SELECT
    'inflation',
    'Purchasing Power Index',
    ROUND(purchasing_power_index, 1)::VARCHAR
FROM MARTS.mart_inflation_impact
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_inflation_impact WHERE purchasing_power_index IS NOT NULL)

UNION ALL

-- Housing metrics
SELECT
    'housing',
    'Median Home Price',
    '$' || TO_CHAR(ROUND(median_home_price, 0), '999,999,999')
FROM MARTS.mart_housing_affordability
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_housing_affordability WHERE median_home_price IS NOT NULL)

UNION ALL

SELECT
    'housing',
    'Mortgage Rate',
    ROUND(mortgage_rate, 2)::VARCHAR || '%'
FROM MARTS.mart_housing_affordability
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_housing_affordability WHERE mortgage_rate IS NOT NULL)

UNION ALL

SELECT
    'housing',
    'Monthly Mortgage Payment',
    '$' || TO_CHAR(ROUND(monthly_mortgage_payment, 0), '999,999,999')
FROM MARTS.mart_housing_affordability
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_housing_affordability WHERE monthly_mortgage_payment IS NOT NULL)

UNION ALL

SELECT
    'housing',
    'Home Price to Income Ratio',
    ROUND(home_price_to_income_ratio, 1)::VARCHAR || 'x'
FROM MARTS.mart_housing_affordability
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_housing_affordability WHERE home_price_to_income_ratio IS NOT NULL)

UNION ALL

SELECT
    'housing',
    'Mortgage Pct of Income',
    ROUND(mortgage_pct_of_income, 1)::VARCHAR || '%'
FROM MARTS.mart_housing_affordability
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_housing_affordability WHERE mortgage_pct_of_income IS NOT NULL)

UNION ALL

-- Savings metrics
SELECT
    'savings',
    'Personal Savings Rate',
    ROUND(savings_rate, 1)::VARCHAR || '%'
FROM MARTS.mart_savings_health
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_savings_health WHERE savings_rate IS NOT NULL)

UNION ALL

SELECT
    'savings',
    'Fed Funds Rate',
    ROUND(fed_funds_rate, 2)::VARCHAR || '%'
FROM MARTS.mart_savings_health
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_savings_health WHERE fed_funds_rate IS NOT NULL)

UNION ALL

SELECT
    'savings',
    'Real Fed Funds Rate',
    ROUND(real_fed_funds, 2)::VARCHAR || '%'
FROM MARTS.mart_savings_health
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_savings_health WHERE real_fed_funds IS NOT NULL)

UNION ALL

SELECT
    'savings',
    'Real 10Y Treasury Yield',
    ROUND(real_treasury_10y, 2)::VARCHAR || '%'
FROM MARTS.mart_savings_health
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_savings_health WHERE real_treasury_10y IS NOT NULL)

UNION ALL

-- Debt metrics
SELECT
    'debt',
    'Credit Card Rate',
    ROUND(credit_card_rate, 1)::VARCHAR || '%'
FROM MARTS.mart_debt_burden
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_debt_burden WHERE credit_card_rate IS NOT NULL)

UNION ALL

SELECT
    'debt',
    'Credit Card Spread over Fed Funds',
    ROUND(credit_card_spread, 1)::VARCHAR || '%'
FROM MARTS.mart_debt_burden
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_debt_burden WHERE credit_card_spread IS NOT NULL)

UNION ALL

SELECT
    'debt',
    'Household Debt Service Ratio',
    ROUND(debt_service_ratio, 1)::VARCHAR || '%'
FROM MARTS.mart_debt_burden
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_debt_burden WHERE debt_service_ratio IS NOT NULL)

UNION ALL

SELECT
    'debt',
    'Revolving Credit Pct of Total',
    ROUND(revolving_pct_of_total, 1)::VARCHAR || '%'
FROM MARTS.mart_debt_burden
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_debt_burden WHERE revolving_pct_of_total IS NOT NULL)

UNION ALL

SELECT
    'debt',
    'Total Consumer Credit YoY Growth',
    ROUND(total_credit_yoy, 1)::VARCHAR || '%'
FROM MARTS.mart_debt_burden
WHERE obs_month = (SELECT MAX(obs_month) FROM MARTS.mart_debt_burden WHERE total_credit_yoy IS NOT NULL)

UNION ALL

-- Investment metrics (latest month across all asset classes)
SELECT
    'investments',
    asset_class || ' Monthly Return',
    ROUND(monthly_return, 2)::VARCHAR || '%'
FROM MARTS.mart_investment_performance
WHERE month_key = (SELECT MAX(month_key) FROM MARTS.mart_investment_performance WHERE monthly_return IS NOT NULL)

UNION ALL

SELECT
    'investments',
    asset_class || ' 12M Rolling Return',
    ROUND(rolling_12m_return, 1)::VARCHAR || '%'
FROM MARTS.mart_investment_performance
WHERE month_key = (SELECT MAX(month_key) FROM MARTS.mart_investment_performance WHERE rolling_12m_return IS NOT NULL)

UNION ALL

SELECT
    'investments',
    'VIX (Market Fear Index)',
    ROUND(vix_monthly_avg, 1)::VARCHAR
FROM MARTS.mart_investment_performance
WHERE month_key = (SELECT MAX(month_key) FROM MARTS.mart_investment_performance WHERE vix_monthly_avg IS NOT NULL)
QUALIFY ROW_NUMBER() OVER (ORDER BY month_key DESC) = 1

UNION ALL

-- Global comparison metrics (latest year, USA)
SELECT
    'global',
    'US GDP Per Capita',
    '$' || TO_CHAR(ROUND(gdp_per_capita, 0), '999,999,999')
FROM MARTS.mart_global_comparison
WHERE country_code = 'USA'
  AND obs_year = (SELECT MAX(obs_year) FROM MARTS.mart_global_comparison WHERE country_code = 'USA' AND gdp_per_capita IS NOT NULL)

UNION ALL

SELECT
    'global',
    'US Inflation Rate',
    ROUND(inflation_rate, 1)::VARCHAR || '%'
FROM MARTS.mart_global_comparison
WHERE country_code = 'USA'
  AND obs_year = (SELECT MAX(obs_year) FROM MARTS.mart_global_comparison WHERE country_code = 'USA' AND inflation_rate IS NOT NULL)

UNION ALL

SELECT
    'global',
    'US Unemployment Rate',
    ROUND(unemployment_rate, 1)::VARCHAR || '%'
FROM MARTS.mart_global_comparison
WHERE country_code = 'USA'
  AND obs_year = (SELECT MAX(obs_year) FROM MARTS.mart_global_comparison WHERE country_code = 'USA' AND unemployment_rate IS NOT NULL)

UNION ALL

SELECT
    'global',
    'US Savings Rate',
    ROUND(savings_rate, 1)::VARCHAR || '%'
FROM MARTS.mart_global_comparison
WHERE country_code = 'USA'
  AND obs_year = (SELECT MAX(obs_year) FROM MARTS.mart_global_comparison WHERE country_code = 'USA' AND savings_rate IS NOT NULL)

UNION ALL

SELECT
    'global',
    'US Gini Index (Inequality)',
    ROUND(gini_index, 2)::VARCHAR
FROM MARTS.mart_global_comparison
WHERE country_code = 'USA'
  AND obs_year = (SELECT MAX(obs_year) FROM MARTS.mart_global_comparison WHERE country_code = 'USA' AND gini_index IS NOT NULL)
;

-- Verify the view
SELECT topic, metric_name, metric_value
FROM INSIGHTS.advisor_current_snapshot
ORDER BY topic, metric_name;
