-- Asserts that stg_fred_observations has no duplicate (series_id, obs_date) combinations.
-- Fails if any composite key appears more than once.
select series_id, obs_date, count(*) as n
from {{ ref('stg_fred_observations') }}
group by series_id, obs_date
having count(*) > 1
