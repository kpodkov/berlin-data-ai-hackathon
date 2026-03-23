-- World Bank observations enriched with parsed codes, human-readable labels, and metadata.
-- Grain: one row per (indicator_code, country_code, obs_date).
-- Joins stg_worldbank_indicators + stg_worldbank_metadata and resolves indicator and
-- country codes to human-readable names via CASE expressions.
{{ config(materialized='table', schema='intermediate') }}

with indicators as (
    select
        series_id,
        indicator_code,
        country_iso3,
        reference_year,
        obs_date,
        value
    from {{ ref('stg_worldbank_indicators') }}
),

metadata as (
    select
        series_id,
        title
    from {{ ref('stg_worldbank_metadata') }}
),

final as (
    select
        i.indicator_code,
        i.country_iso3 as country_code,
        case i.indicator_code
            when 'NY.GDP.PCAP.PP.CD' then 'GDP per Capita'
            when 'FP.CPI.TOTL.ZG' then 'Inflation Rate'
            when 'SL.UEM.TOTL.ZS' then 'Unemployment'
            when 'FR.INR.RINR' then 'Real Interest Rate'
            when 'NY.GNS.ICTR.ZS' then 'Savings Rate'
            when 'SI.POV.GINI' then 'Gini Index'
            when 'SI.DST.10TH.10' then 'Income Share Top 10'
            when 'BX.TRF.PWKR.CD.DT' then 'Remittances'
            when 'SP.DYN.LE00.IN' then 'Life Expectancy'
            when 'PA.NUS.PPP' then 'PPP Factor'
            else 'Other'
        end as indicator_name,
        case i.country_iso3
            when 'USA' then 'United States'
            when 'DEU' then 'Germany'
            when 'GBR' then 'United Kingdom'
            when 'JPN' then 'Japan'
            when 'FRA' then 'France'
            when 'CAN' then 'Canada'
            when 'ITA' then 'Italy'
            when 'CHN' then 'China'
            when 'IND' then 'India'
            when 'BRA' then 'Brazil'
            when 'ZAF' then 'South Africa'
            when 'KOR' then 'South Korea'
            when 'AUS' then 'Australia'
            when 'MEX' then 'Mexico'
            when 'NGA' then 'Nigeria'
            else i.country_iso3
        end as country_name,
        i.obs_date,
        i.reference_year as obs_year,
        i.value,
        m.title
    from indicators i
    left join metadata m on i.series_id = m.series_id
)

select * from final
