-- Deprecated: use stg_fred_observations in models/staging/ instead.
select * from {{ ref('stg_fred_observations') }}
