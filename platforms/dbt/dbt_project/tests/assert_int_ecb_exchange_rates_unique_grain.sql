-- Asserts that int_ecb_exchange_rates has no duplicate (series_id, month_date) combinations.
-- Fails if any composite key appears more than once.
select series_id, month_date, count(*) as n
from {{ ref('int_ecb_exchange_rates') }}
group by series_id, month_date
having count(*) > 1
