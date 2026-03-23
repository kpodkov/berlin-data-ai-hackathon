with observations as (
    select * from {{ source('raw', 'FRED_OBSERVATIONS') }}
),

metadata as (
    select * from {{ source('raw', 'FRED_SERIES_METADATA') }}
),

final as (
    select
        o.series_id,
        o.obs_date,
        o.value,
        m.title,
        m.units,
        m.frequency,
        case
            when o.series_id in ('PI', 'CES0500000003', 'MEHOINUSA672N', 'A229RX0') then 'income'
            when o.series_id in ('PSAVERT', 'SAVINGSL') then 'savings'
            when o.series_id in ('MORTGAGE30US', 'TERMCBCCALLNS', 'TOTALSL', 'REVOLSL', 'NONREVSL', 'TDSP') then 'debt'
            when o.series_id in ('CSUSHPISA', 'MSPUS', 'FIXHAI', 'CUSR0000SEHA', 'HOUST') then 'housing'
            when o.series_id in ('CPIAUCSL', 'CPIUFDSL', 'CPIENGSL', 'CPIMEDSL', 'CUSR0000SAE1', 'CUUR0000SAT1') then 'cpi'
            when o.series_id in ('FEDFUNDS', 'DGS10') then 'rates'
            when o.series_id in ('SP500', 'VIXCLS') then 'market'
            when o.series_id in ('TNWBSHNO', 'WFRBST01134') then 'wealth'
            when o.series_id in ('GDPC1', 'UNRATE') then 'macro'
            else 'other'
        end as topic
    from observations o
    left join metadata m on o.series_id = m.series_id
)

select * from final
