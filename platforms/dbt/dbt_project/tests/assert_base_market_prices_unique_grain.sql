-- Asserts that base_market_prices has no duplicate (series_id, obs_date) combinations.
-- Fails if any composite key appears more than once.
select series_id, obs_date, count(*) as n
from {{ ref('base_market_prices') }}
group by series_id, obs_date
having count(*) > 1
