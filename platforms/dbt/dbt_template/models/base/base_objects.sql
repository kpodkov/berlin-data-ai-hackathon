-- JustWatch content metadata | ~2.3M rows
-- Join to events: cc_title:jwEntityId::TEXT = object_id

select *
from {{ source('jw_shared', 'OBJECTS') }}
