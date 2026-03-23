-- Unified macro environment snapshot for the financial advisor dashboard.
-- Grain: one row per indicator (series_id), latest monthly snapshot only.
--
-- Answers: "Where are we in the economic cycle?"
-- Overall verdict computed as a majority vote across indicator signal_color values:
--   >= 60 % green  → 'Favorable'
--   >= 40 % red    → 'Caution Advised'
--   otherwise      → 'Mixed Signals'
--
-- Upstream: int_macro_regime_indicators

{{ config(materialized='table', schema='marts') }}

-- ---------------------------------------------------------------------------
-- 1. macro: all indicator rows, rename title → indicator_name, map category
-- ---------------------------------------------------------------------------
with macro as (
    select
        series_id,
        title                                                       as indicator_name,

        -- Derive a human-readable category from series_id.
        -- int_macro_regime_indicators does not carry a category column,
        -- so we assign one here for dashboard grouping.
        case series_id
            when 'GDPC1'    then 'Growth'
            when 'CPIAUCSL' then 'Inflation'
            when 'UNRATE'   then 'Labor Market'
            when 'FEDFUNDS' then 'Interest Rates'
            when 'DGS10'    then 'Interest Rates'
            when 'PSAVERT'  then 'Consumer Health'
            when 'TDSP'     then 'Consumer Health'
            when 'VIXCLS'   then 'Market Sentiment'
            when 'SP500'    then 'Market Sentiment'
            else                 'Other'
        end                                                         as category,

        units,
        as_of_period,
        value                                                       as latest_value,
        value_12m_ago,
        yoy_change_pct,
        rolling_mean_36m,
        rolling_stddev_36m,
        z_score,
        regime_label,
        signal_color

    from {{ ref('int_macro_regime_indicators') }}
),

-- ---------------------------------------------------------------------------
-- 2. signal_counts: tally green / yellow / red across all indicators
-- ---------------------------------------------------------------------------
signal_counts as (
    select
        countif(signal_color = 'green')     as green_count,
        countif(signal_color = 'yellow')    as yellow_count,
        countif(signal_color = 'red')       as red_count,
        count(*)                            as total_indicators
    from macro
),

-- ---------------------------------------------------------------------------
-- 3. verdict: overall environment label and traffic light colour
-- ---------------------------------------------------------------------------
verdict as (
    select
        green_count,
        yellow_count,
        red_count,
        total_indicators,

        case
            when green_count >= total_indicators * 0.6
                then 'Favorable'
            when red_count   >= total_indicators * 0.4
                then 'Caution Advised'
            else 'Mixed Signals'
        end                                                         as overall_environment,

        case
            when green_count >= total_indicators * 0.6
                then 'green'
            when red_count   >= total_indicators * 0.4
                then 'red'
            else 'yellow'
        end                                                         as overall_traffic_light

    from signal_counts
)

-- ---------------------------------------------------------------------------
-- 4. final: cross-join each indicator row with the single verdict row
-- ---------------------------------------------------------------------------
select
    m.series_id,
    m.indicator_name,
    m.category,
    m.units,
    m.as_of_period,
    round(m.latest_value, 2)                                        as latest_value,
    m.yoy_change_pct,
    m.z_score,
    m.regime_label,
    m.signal_color,
    v.overall_environment,
    v.overall_traffic_light,
    v.green_count,
    v.yellow_count,
    v.red_count,
    'Illustrative only — uses finalized historical data. Not investment advice.'
                                                                    as disclaimer,
    current_timestamp()                                             as _loaded_at

from macro as m
cross join verdict as v

order by
    case m.signal_color
        when 'red'    then 1
        when 'yellow' then 2
        else               3
    end,
    m.category
