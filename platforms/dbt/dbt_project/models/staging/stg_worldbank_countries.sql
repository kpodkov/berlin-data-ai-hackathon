with indicators as (
    select * from {{ source('raw', 'WORLDBANK_INDICATORS') }}
),

metadata as (
    select * from {{ source('raw', 'WORLDBANK_METADATA') }}
),

final as (
    select
        left(i.series_id, length(i.series_id) - 4) as indicator_code,
        right(i.series_id, 3) as country_code,
        case left(i.series_id, length(i.series_id) - 4)
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
        case right(i.series_id, 3)
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
            else right(i.series_id, 3)
        end as country_name,
        i.obs_date,
        year(i.obs_date) as obs_year,
        i.value,
        m.title
    from indicators i
    left join metadata m on i.series_id = m.series_id
)

select * from final
