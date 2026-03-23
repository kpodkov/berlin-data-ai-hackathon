-- Grain: one row per deduplicated event (T1 — Germany, Dec 2025)
-- Passthrough of stg_events_t1. Exposes all event columns for marts
-- that need raw event rows (e.g. for user-level joins before aggregation).
--
-- Used by: mart_segment_title_demand
{{ config(materialized='view') }}

select * from {{ ref('stg_events_t1') }}
