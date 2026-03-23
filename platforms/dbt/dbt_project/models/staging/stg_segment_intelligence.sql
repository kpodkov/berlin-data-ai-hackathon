with source as (
    select * from {{ source('analysis', 'SEGMENT_INTELLIGENCE') }}
),

staged as (
    select
        segment,
        users,
        pct_of_total,
        avg_events,
        avg_clickout_pct,
        avg_tvod_clicks,
        avg_svod_clicks,
        avg_avod_clicks,
        avg_financial_score,
        avg_imdb,
        avg_weekend_pct,
        top_genre,
        top_os,
        top_client,
        top_provider,
        ai_insight
    from source
)

select * from staged
