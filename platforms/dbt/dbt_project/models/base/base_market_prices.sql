-- Yahoo Finance daily prices | 13 instruments | DB_TEAM_3.RAW.MARKET_PRICES
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per (series_id, obs_date). Values are adjusted closing prices in USD.
-- See _market_sources.yml for full series catalogue and date coverage per instrument.
{{ config(materialized='table', schema='base') }}

with source as (
    select * from {{ source('raw', 'MARKET_PRICES') }}
),

bronze as (
    select
        -- identity
        series_id,
        obs_date,

        -- value (NULL = no data for this date)
        value,

        -- audit metadata
        'yahoo_finance'     as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
