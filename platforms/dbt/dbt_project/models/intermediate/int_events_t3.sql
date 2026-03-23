-- Grain: one row per deduplicated event (T3 — 8 EU markets, Nov 2025 – Jan 2026)
-- Passthrough of stg_events_t3. Exposes all event columns for marts
-- that need raw event rows (e.g. weekly aggregation for seasonal analysis).
--
-- Requires WH_TEAM_<N>_S or larger (128M rows, 17.9 GB).
--
-- Used by: mart_title_seasonality
{{ config(materialized='view') }}

select * from {{ ref('stg_events_t3') }}
