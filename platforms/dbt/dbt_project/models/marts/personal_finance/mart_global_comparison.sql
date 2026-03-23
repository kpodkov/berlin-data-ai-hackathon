with pivoted as (
    select
        country_code,
        country_name,
        obs_year,
        max(case when indicator_code = 'NY.GDP.PCAP.PP.CD' then value end) as gdp_per_capita,
        max(case when indicator_code = 'FP.CPI.TOTL.ZG' then value end) as inflation_rate,
        max(case when indicator_code = 'SL.UEM.TOTL.ZS' then value end) as unemployment_rate,
        max(case when indicator_code = 'FR.INR.RINR' then value end) as real_interest_rate,
        max(case when indicator_code = 'NY.GNS.ICTR.ZS' then value end) as savings_rate,
        max(case when indicator_code = 'SI.POV.GINI' then value end) as gini_index,
        max(case when indicator_code = 'SI.DST.10TH.10' then value end) as income_share_top10,
        max(case when indicator_code = 'BX.TRF.PWKR.CD.DT' then value end) as remittances_usd,
        max(case when indicator_code = 'SP.DYN.LE00.IN' then value end) as life_expectancy,
        max(case when indicator_code = 'PA.NUS.PPP' then value end) as ppp_factor
    from {{ ref('int_worldbank_enriched') }}
    group by 1, 2, 3
)

select
    country_code,
    country_name,
    obs_year,
    round(gdp_per_capita, 0) as gdp_per_capita,
    round(inflation_rate, 1) as inflation_rate,
    round(unemployment_rate, 1) as unemployment_rate,
    round(real_interest_rate, 1) as real_interest_rate,
    round(savings_rate, 1) as savings_rate,
    round(gini_index, 1) as gini_index,
    round(income_share_top10, 1) as income_share_top10,
    round(remittances_usd, 0) as remittances_usd,
    round(life_expectancy, 1) as life_expectancy,
    round(ppp_factor, 2) as ppp_factor
from pivoted
