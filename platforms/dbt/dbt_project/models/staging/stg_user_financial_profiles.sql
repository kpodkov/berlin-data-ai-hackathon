with source as (
    select * from {{ source('analysis', 'USER_FINANCIAL_PROFILES') }}
),

staged as (
    select
        user_id,
        segment,
        financial_score,
        tvod_propensity,
        svod_tier,
        is_cinema_goer,
        is_free_only,
        engagement_tier,
        loyalty_tier,
        planning_behavior,
        watchlist_conversion_rate,
        content_quality_tier,
        budget_content_pref,
        recency_preference,
        language_preference,
        device_ecosystem,
        viewing_time_profile,
        schedule_type,
        top_genre_1,
        top_genre_2,
        top_genre_3,
        top_provider,
        second_provider,
        unique_providers_used,
        primary_city,
        primary_region,
        avg_imdb_score,
        clickout_svod,
        clickout_avod,
        clickout_tvod,
        clickout_cinema,
        total_events,
        total_sessions,
        max_session_idx,
        is_logged_in_user
    from source
)

select * from staged
