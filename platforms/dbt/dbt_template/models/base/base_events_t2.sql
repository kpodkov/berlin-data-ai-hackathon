-- 8 EU markets | Dec 2025 | ~40M rows | 5.7 GB
-- Scale up from T1 once query logic is validated.

select *
from {{ source('jw_shared', 'T2') }}
