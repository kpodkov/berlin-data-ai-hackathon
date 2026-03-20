-- 15 global markets | Nov–Dec 2025 | ~254M rows | 36.1 GB
-- Full dataset for global analysis. Recommend WH_TEAM_<N>_M for complex queries.

select *
from {{ source('jw_shared', 'T4') }}
