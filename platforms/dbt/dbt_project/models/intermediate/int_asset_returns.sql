-- Grain: one row per (series_id, month_date)
-- Resamples daily Yahoo Finance prices to monthly closes, then computes
-- return and risk metrics for each instrument.
--
-- Sources: base_market_prices (daily prices), base_market_metadata (labels)
-- Used by: financial advisor dashboard marts
{{ config(materialized='table', schema='intermediate') }}

with

-- ── 1. Resample daily prices to monthly ──────────────────────────────────────
-- Keep only the last trading day of each calendar month per series.
monthly_prices as (
    select
        series_id,
        date_trunc('month', obs_date)::date as month_date,
        obs_date                            as last_trade_date,
        value                               as monthly_close
    from {{ ref('base_market_prices') }}
    where value is not null
    qualify
        row_number() over (
            partition by series_id, date_trunc('month', obs_date)
            order by obs_date desc
        ) = 1
),

-- ── 2. Enrich with metadata and asset class label ────────────────────────────
with_metadata as (
    select
        mp.series_id,
        mp.month_date,
        mp.last_trade_date,
        mp.monthly_close,

        -- Human-readable title from metadata table
        md.title,

        -- Asset class mapping for dashboard grouping
        case mp.series_id
            when 'SPY'      then 'US Equity'
            when 'QQQ'      then 'US Equity (Growth)'
            when 'XLE'      then 'Energy'
            when 'AGG'      then 'US Bonds'
            when 'TLT'      then 'Long Treasury'
            when 'TIP'      then 'TIPS'
            when 'VNQ'      then 'Real Estate'
            when 'GLD'      then 'Gold'
            when 'VEA'      then 'Intl Developed'
            when 'VWO'      then 'Intl Emerging'
            when 'BTC-USD'  then 'Crypto'
            when 'ETH-USD'  then 'Crypto'
            when 'DX-Y.NYB' then 'USD Index'
            else 'Other'
        end as asset_class,

        md.units,
        md.frequency,
        md.source

    from monthly_prices as mp
    left join {{ ref('base_market_metadata') }} as md
        on mp.series_id = md.series_id
),

-- ── 3. Compute price-based return metrics ────────────────────────────────────
-- monthly_return    : simple period-over-period return (m vs m-1)
-- trailing_12m_return : simple 12-month return (m vs m-12)
-- all_time_high     : running maximum close through current month
-- drawdown_from_ath : percentage decline from all-time high
with_returns as (
    select
        series_id,
        month_date,
        last_trade_date,
        monthly_close,
        title,
        asset_class,
        units,
        frequency,
        source,

        -- Month-over-month return
        round(
            (monthly_close - lag(monthly_close, 1) over (partition by series_id order by month_date))
            / nullif(lag(monthly_close, 1) over (partition by series_id order by month_date), 0),
            4
        ) as monthly_return,

        -- Trailing 12-month return (point-to-point, not annualised)
        round(
            (monthly_close - lag(monthly_close, 12) over (partition by series_id order by month_date))
            / nullif(lag(monthly_close, 12) over (partition by series_id order by month_date), 0),
            4
        ) as trailing_12m_return,

        -- Running all-time high through this month
        max(monthly_close) over (
            partition by series_id
            order by month_date
            rows between unbounded preceding and current row
        ) as all_time_high,

        -- Drawdown from ATH (0.00 at ATH, negative values below it)
        round(
            (monthly_close - max(monthly_close) over (
                partition by series_id
                order by month_date
                rows between unbounded preceding and current row
            ))
            / nullif(max(monthly_close) over (
                partition by series_id
                order by month_date
                rows between unbounded preceding and current row
            ), 0),
            4
        ) as drawdown_from_ath

    from with_metadata
),

-- ── 4. Rolling volatility and Sharpe ratio ───────────────────────────────────
-- trailing_12m_vol : annualised stddev of monthly returns over last 12 months
-- months_in_window : actual data points in window (guards against partial windows)
-- sharpe_ratio     : trailing_12m_return / trailing_12m_vol (only when window is full)
with_vol as (
    select
        series_id,
        month_date,
        last_trade_date,
        monthly_close,
        title,
        asset_class,
        units,
        frequency,
        source,
        monthly_return,
        trailing_12m_return,
        all_time_high,
        drawdown_from_ath,

        -- Annualised volatility: monthly stddev × sqrt(12)
        round(
            stddev(monthly_return) over (
                partition by series_id
                order by month_date
                rows between 11 preceding and current row
            ) * sqrt(12),
            4
        ) as trailing_12m_vol,

        -- Count of non-null returns in the 12-month window
        count(monthly_return) over (
            partition by series_id
            order by month_date
            rows between 11 preceding and current row
        ) as months_in_window

    from with_returns
),

-- ── 5. Final — add Sharpe ratio and momentum label ───────────────────────────
-- Filter to rows that have at least one prior month (monthly_return IS NOT NULL)
-- so the mart never surfaces the first data point for each series.
final as (
    select
        series_id,
        month_date,
        last_trade_date,
        title,
        asset_class,
        units,
        frequency,
        source,
        monthly_close,
        monthly_return,
        trailing_12m_return,
        all_time_high,
        drawdown_from_ath,
        trailing_12m_vol,
        months_in_window,

        -- Sharpe ratio: only meaningful when we have a full 12-month window
        -- and non-zero volatility (avoids division by zero and misleading values)
        case
            when months_in_window >= 12 and trailing_12m_vol > 0
                then round(trailing_12m_return / trailing_12m_vol, 2)
            else null
        end as sharpe_ratio,

        -- Momentum label based on trailing 12-month performance
        case
            when trailing_12m_return > 0.10  then 'Strong Uptrend'
            when trailing_12m_return > 0     then 'Uptrend'
            when trailing_12m_return > -0.10 then 'Downtrend'
            else 'Strong Downtrend'
        end as momentum_label

    from with_vol
    where monthly_return is not null
)

select * from final
