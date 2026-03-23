-- Deprecated: use stg_fred_series_metadata in models/staging/ instead.
select * from {{ ref('stg_fred_series_metadata') }}
