-- Asserts that stg_market_returns has no duplicate (series_id, obs_date) combinations.
-- Fails if any composite key appears more than once.
select series_id, obs_date, count(*) as n
from {{ ref('stg_market_returns') }}
group by series_id, obs_date
having count(*) > 1
