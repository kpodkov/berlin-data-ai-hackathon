-- Streaming provider lookup | 1,526 rows
-- Join to events: cc_clickout:providerId::NUMBER = id

select *
from {{ source('jw_shared', 'PACKAGES') }}
