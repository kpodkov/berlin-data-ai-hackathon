-- Yahoo Finance instrument catalogue | 13 instruments | DB_TEAM_3.RAW.MARKET_METADATA
-- Bronze layer: faithful copy of the raw ingestion table with audit metadata added.
-- One row per series_id (ticker). Join to stg_market_prices on series_id for enriched price data.
-- See _market_sources.yml for full column descriptions.
{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'MARKET_METADATA') }}
),

bronze as (
    select
        -- identity
        series_id,

        -- descriptive attributes
        title,
        units,
        frequency,
        source,

        -- audit metadata
        'yahoo_finance'     as _source,
        current_timestamp() as _loaded_at

    from source
)

select * from bronze
