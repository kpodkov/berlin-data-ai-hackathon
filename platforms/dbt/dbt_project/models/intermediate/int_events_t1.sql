-- Grain: one row per deduplicated event (T1 — Germany, Dec 2025)
-- Passthrough of base_events_t1. Exposes all event columns for marts
-- that need raw event rows (e.g. for user-level joins before aggregation).
--
-- Used by: fct_segment_title_demand
{{ config(materialized='view') }}

select * from {{ ref('base_events_t1') }}
