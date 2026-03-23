-- Traffic-light risk monitor for a financial advisor dashboard.
-- Grain: one row per risk indicator (~4 rows), each carrying the composite overall score.
-- Answers the question: "Should I be worried right now?"
--
-- Upstream:
--   int_risk_dashboard          — individual indicator signals (traffic_light, action_text, etc.)
--   int_macro_regime_indicators — macro regime context (available for future enrichment)
--
-- Overall risk score:
--   red = 100 pts, yellow = 50 pts, green = 0 pts
--   overall_risk_score = AVG(signal_score), rounded to 0 decimal places
--   < 30 → Low Risk (green) | 30–59 → Moderate Risk (yellow) | >= 60 → High Risk (red)
{{ config(materialized='table', schema='marts') }}

with risk_signals as (
    select * from {{ ref('int_risk_dashboard') }}
),

signal_scores as (
    select
        risk_indicator,
        category,
        risk_value,
        units,
        traffic_light,
        action_text,
        urgency_rank,
        _loaded_at,

        case traffic_light
            when 'red'    then 100
            when 'yellow' then 50
            when 'green'  then 0
        end as signal_score

    from risk_signals
),

overall as (
    select
        round(avg(signal_score), 0) as overall_risk_score,

        case
            when round(avg(signal_score), 0) < 30 then 'Low Risk'
            when round(avg(signal_score), 0) < 60 then 'Moderate Risk'
            else 'High Risk'
        end as overall_risk_label,

        case
            when round(avg(signal_score), 0) < 30 then 'green'
            when round(avg(signal_score), 0) < 60 then 'yellow'
            else 'red'
        end as overall_traffic_light

    from signal_scores
),

final as (
    select
        s.risk_indicator,
        s.category,
        s.risk_value,
        s.units,
        s.traffic_light,
        s.action_text,
        s.urgency_rank,
        s.signal_score,
        o.overall_risk_score,
        o.overall_risk_label,
        o.overall_traffic_light,
        'Illustrative only — uses finalized historical data. Not investment advice.' as disclaimer,
        current_timestamp() as _loaded_at

    from signal_scores s
    cross join overall o
)

select * from final
order by urgency_rank, risk_indicator
