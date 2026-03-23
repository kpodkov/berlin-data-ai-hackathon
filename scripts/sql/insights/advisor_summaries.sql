USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;

CREATE OR REPLACE TABLE INSIGHTS.advisor_summaries AS

SELECT
    'inflation' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'inflation'

UNION ALL

SELECT
    'housing' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'housing'

UNION ALL

SELECT
    'savings' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'savings'

UNION ALL

SELECT
    'debt' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'debt'

UNION ALL

SELECT
    'investments' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'investments'

UNION ALL

SELECT
    'global' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor talking to a regular person (not a financial expert). Based on these current US economic numbers comparing America to the world, write exactly 3 short sentences of practical, plain-English insight. Do not use jargon. Be specific with numbers.' ||
        ' Data: ' ||
        LISTAGG(metric_name || ': ' || metric_value, ' | ') WITHIN GROUP (ORDER BY metric_name)
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
FROM INSIGHTS.advisor_current_snapshot
WHERE topic = 'global'

UNION ALL

SELECT
    'headline' AS topic,
    SNOWFLAKE.CORTEX.COMPLETE(
        'llama3.1-70b',
        'You are a friendly personal finance advisor. Summarize the overall state of personal finances in America in exactly 3 sentences for a regular person. Be specific with numbers. No jargon.' ||
        ' Data: ' ||
        (
            SELECT LISTAGG(topic || ' - ' || metric_name || ': ' || metric_value, ' | ')
                   WITHIN GROUP (ORDER BY topic, metric_name)
            FROM INSIGHTS.advisor_current_snapshot
        )
    ) AS summary_text,
    CURRENT_TIMESTAMP() AS generated_at
;

-- Verify results
SELECT topic, LEFT(summary_text, 200) AS preview
FROM INSIGHTS.advisor_summaries
ORDER BY topic;
