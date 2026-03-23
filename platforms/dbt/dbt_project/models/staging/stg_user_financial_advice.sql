with source as (
    select * from {{ source('analysis', 'USER_FINANCIAL_ADVICE') }}
),

staged as (
    select
        user_id,
        segment,
        financial_score,
        financial_advice
    from source
)

select * from staged
