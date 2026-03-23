-- Asserts that mart_personalized_advisor has no duplicate (user_id, macro_series_id) combinations.
-- Fails if any composite key appears more than once.
select user_id, macro_series_id, count(*) as n
from {{ ref('mart_personalized_advisor') }}
group by user_id, macro_series_id
having count(*) > 1
