# SQL & dbt Conventions

> Central SQL reference for all Upvest agents working with BigQuery and dbt.
> Always use BigQuery Standard SQL (never legacy SQL).
> Always run sqlfluff after writing or modifying SQL files.

---

## SQL Execution Order

SQL clauses execute in this order (not the order they appear in the query):

```
1. FROM / JOIN     ← tables assembled first
2. WHERE           ← rows filtered
3. GROUP BY        ← rows grouped
4. HAVING          ← groups filtered (aggregates OK here, not in WHERE)
5. WINDOW          ← window functions computed
6. SELECT          ← columns selected / expressions evaluated
7. DISTINCT        ← duplicates removed
8. UNION           ← result sets combined
9. ORDER BY        ← rows sorted
10. LIMIT / OFFSET ← rows truncated
```

This matters because: you can't use a column alias from `SELECT` in `WHERE` (SELECT runs after WHERE), and aggregate functions can't appear in `WHERE` (use `HAVING` instead).

---

## BigQuery SQL Standards

### Dialect

- **Always BigQuery Standard SQL** — never legacy SQL
- Use `SAFE_CAST` over `CAST` when data quality is uncertain
- Use `IFNULL` / `COALESCE` explicitly — don't rely on implicit NULL behavior

### Backtick Quoting (mandatory)

**Always backtick-quote fully-qualified table references.** GCP project IDs contain hyphens (e.g., `dta-bq-live-914e`) which are invalid unquoted identifiers — BigQuery interprets the hyphens as minus operators.

```sql
-- WRONG — BigQuery parses this as dta minus bq minus live minus 914e
SELECT * FROM dta-bq-live-914e.mart_trading.fact_order_execution

-- CORRECT — backticks escape the project ID
SELECT * FROM `dta-bq-live-914e.mart_trading.fact_order_execution`

-- CORRECT — backtick the full path (project.dataset.table)
SELECT * FROM `dta-bq-unstable-58ae.etl.raw_orders`
```

**Rule**: Every `FROM`, `JOIN`, or table reference that includes a project ID must be backtick-quoted. This applies to all Upvest projects:
- `` `dta-bq-live-914e.dataset.table` ``
- `` `dta-bq-sandbox-a3c2.dataset.table` ``
- `` `dta-bq-staging-a6c4.dataset.table` ``
- `` `dta-bq-unstable-58ae.dataset.table` ``

**Never hardcode project IDs in scheduled workloads.** Any SQL running on the cloud (dbt, Cloud Run jobs, Cloud Scheduler) must resolve the project from the environment — not from a string literal in the query.

| Context | How to Reference Project |
|---|---|
| dbt models | `{{ target.project }}`, `source()`, `ref()` — dbt resolves per environment |
| Cloud Run Python jobs | `os.environ["GCP_PROJECT"]` or BigQuery client's default project |
| Ad-hoc `bq` CLI queries | `--project_id` flag or `gcloud config get-value project` |
| Terraform/Terragrunt | Variable interpolation, never inline strings |

Hardcoded project IDs cause queries to hit the wrong environment when promoted across stages (unstable → staging → sandbox → live).

### Reserved Keywords

BigQuery reserves these words — **never use them as column or alias names** without backtick quoting. Common offenders in Upvest models:

| Keyword | Commonly Misused As | Fix |
|---|---|---|
| `ALL` | — | — |
| `AND` | — | — |
| `AS` | — | — |
| `BETWEEN` | — | — |
| `BY` | — | — |
| `CASE` | column name | `case_type`, `case_id` |
| `CROSS` | — | — |
| `CURRENT` | column name, struct prefix (`current.<field>`) | Rename in staging: `current_state`, `current_balance`, `current_status`. For nested structs arriving as `current.<field>`, flatten and prefix in `stg_*`: e.g., `current.balance` → `current_balance` |
| `DATE` | column name | `event_date`, `trade_date`, `created_date` |
| `DEFAULT` | column name | `is_default`, `default_value` |
| `END` | column name | `end_date`, `end_time` |
| `EXISTS` | — | — |
| `EXTRACT` | — | — |
| `FALSE` | — | — |
| `FETCH` | — | — |
| `FOR` | — | — |
| `FROM` | — | — |
| `FULL` | — | — |
| `GROUP` | column name | `group_name`, `user_group` |
| `HAVING` | — | — |
| `IF` | — | — |
| `IN` | — | — |
| `INNER` | — | — |
| `INTERVAL` | column name | `time_interval`, `interval_days` |
| `INTO` | — | — |
| `IS` | — | — |
| `JOIN` | — | — |
| `LEFT` | — | — |
| `LIMIT` | column name | `rate_limit`, `limit_amount` |
| `MERGE` | — | — |
| `NEW` | column name | `is_new`, `new_value` |
| `NOT` | — | — |
| `NULL` | — | — |
| `ON` | — | — |
| `OR` | — | — |
| `ORDER` | column name | `order_id`, `sort_order` |
| `OUTER` | — | — |
| `OVER` | — | — |
| `PARTITION` | column name | `partition_key`, `partition_id` |
| `RANGE` | column name | `price_range`, `date_range` |
| `RIGHT` | — | — |
| `ROLLUP` | — | — |
| `ROWS` | column name | `row_count`, `num_rows` |
| `SELECT` | — | — |
| `SET` | column name | `data_set`, `result_set` |
| `TABLE` | column name | `table_name`, `source_table` |
| `THEN` | — | — |
| `TO` | — | — |
| `TRUE` | — | — |
| `UNION` | — | — |
| `USING` | — | — |
| `WHEN` | — | — |
| `WHERE` | — | — |
| `WINDOW` | column name | `time_window`, `window_size` |
| `WITH` | — | — |

**Rule**: If you must use a reserved word as a column name (e.g., from an upstream source), backtick-quote it: `` `order` ``, `` `group` ``. Prefer renaming in the staging layer to avoid propagating reserved-word columns downstream.

Full list: https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#reserved_keywords

### Naming

- Snake_case for all identifiers: `order_execution_id`, `created_at`
- Prefix staging models: `stg_entities__<entity>`, `stg_history__<entity>_update`
- Prefix intermediate models: `int_<description>`
- Prefix mart models: domain-specific schemas (`mart_trading`, `mart_risk`, etc.)

### Formatting & Style

**Automation first** — run `sqlfluff` after every SQL change:
```bash
cd dbt/ && make sql-lint SQLFLUFF_SELECT=<folder>
cd dbt/ && make sql-fix SQLFLUFF_SELECT=<folder>
```
Fix all non-Jinja errors before work is complete.

**SQL reads like English** — lean into SQL's declarative nature:

```sql
-- GOOD — clear, readable, one concept per line
with

orders as (
    select * from {{ ref('stg_entities__order') }}
),

payments as (
    select * from {{ ref('stg_history__payment_update') }}
),

final as (
    select
        orders.order_id,
        orders.customer_id,
        orders.order_date,
        payments.payment_method,
        sum(payments.amount) as total_amount
    from orders
    left join payments on orders.order_id = payments.order_id
    where orders.order_date >= '2024-01-01'
    group by 1, 2, 3, 4
)

select * from final
```

**Rules:**
- **Keywords lowercase** in dbt models: `select`, `from`, `where`, `join`, `group by` (sqlfluff enforces this)
- **One column per line** in `select` — makes git diffs clean (adding/removing a column = one line change)
- **Trailing commas** in `select` lists — easier to add/remove columns without touching adjacent lines
- **CTEs over subqueries** — name each step clearly, like paragraphs in prose
- **CTE naming**: use descriptive names (`orders`, `filtered_payments`, `final`) — not `cte1`, `cte2`
- **Start with `with`** — define all CTEs first, final `select` at the bottom
- **Final CTE named `final`** — the last CTE before the closing `select * from final`
- **4-space indentation** (sqlfluff default)
- **No trailing whitespace**
- **Blank line between CTEs** — visual separation
- **`select *` only in staging models** and final CTE passthrough — never in intermediate/mart logic
- **Explicit column lists** in intermediate and mart models — makes dependencies clear for `dbt docs`

**Join style:**
```sql
-- GOOD — join condition on same line, explicit join type
from orders
left join payments on orders.order_id = payments.order_id
inner join customers on orders.customer_id = customers.customer_id

-- BAD — implicit join (ANSI-89 style)
from orders, payments
where orders.order_id = payments.order_id
```

**WHERE clause style:**
```sql
-- GOOD — one condition per line
where
    orders.order_date >= '2024-01-01'
    and orders.status != 'cancelled'
    and payments.amount > 0

-- BAD — everything on one line
where orders.order_date >= '2024-01-01' and orders.status != 'cancelled' and payments.amount > 0
```

**Comments:**
```sql
-- GOOD — explain WHY, not WHAT
-- Filter out test orders created by QA team (tenant_id = 'test-tenant')
where tenant_id != 'test-tenant'

-- BAD — restating the code
-- Filter where tenant_id is not test-tenant
where tenant_id != 'test-tenant'
```

### Performance

- **Partition pruning**: Always filter on partition column (`_PARTITIONTIME` or custom) — avoid full table scans
- **Clustering**: Cluster tables by high-cardinality filter columns (e.g., `tenant_id`, `instrument_id`)
- **SELECT only needed columns**: BigQuery is columnar — every column costs scan bytes
- **Never SELECT**: Especially on `etl.*` raw tables and PII tables
- **Estimate cost before running**: `bq query --dry_run --use_legacy_sql=false 'SELECT ...'`
- **Materialized views**: For frequently-run aggregations that don't need real-time freshness
- **Flag models scanning >1TB**: Check `bytes_processed` in BigQuery job metadata

---

## dbt Conventions

### Model Layers (Medallion Architecture)

Upvest's dbt project follows a medallion architecture — data quality improves as it flows through layers. All captured data exists in raw tables, so any downstream table can be rebuilt from source.

| Medallion | dbt Layer | Prefix | Owner | Purpose |
|---|---|---|---|---|
| Bronze | Raw (ETL) | `etl.*` | data-engineer (kroute) | Raw CDC data from Kafka — no transforms, append-only |
| Silver | Staging | `stg_*` | data-engineer | 1:1 with `etl.*` — cleaning, casting, renaming only. No business logic |
| Silver | Intermediate | `int_*` | data-analytics-engineer | Cross-source joins, pivots, deduplication, business logic prep |
| Gold | Mart | `mart_*` | data-analytics-engineer | Business-facing facts and dimensions, aggregated to business grain |

```
Kafka → kroute → etl.* (bronze) → stg_* (silver) → int_* (silver) → mart_* (gold) → Looker
```

**Rules:**
- **Bronze (`etl.*`)**: never modify directly — data arrives via kroute only. Never expose to intermediate/mart models
- **Silver (`stg_*`)**: exactly one staging model per source table. Rename/recast fields here — all downstream inherits clean names
- **Silver (`int_*`)**: cross-source joins, deduplication, grain changes. Test grain changes independently
- **Gold (`mart_*`)**: business definitions in SQL, ready for Looker/BI consumption
- **Rebuild guarantee**: since all raw data is in bronze, any silver/gold table can be rebuilt from scratch

### Staging Layer Best Practices

- `stg_entities__<entity>` — current-state entity snapshots
- `stg_history__<entity>_update` — append-only history from Kafka event log
- Staging models are typically **materialized as views** — freshest data, no storage cost
- **No business logic in staging** — only cleaning, casting, renaming, basic unit conversions
- **One staging model per source table** — clean entry point for lineage tracking
- **Organize by source system** — group by data origin (`orders/`, `payments/`), not by team
- **Naming**: `stg_<source>__<entity>` — links model to source table unambiguously

### Intermediate Layer Best Practices

- **Name with verbs** describing the transformation:
  - `int_orders_joined` — orders joined to customers
  - `int_users_aggregated_to_daily` — user events rolled up to daily grain
  - `int_positions_deduped` — positions after deduplication
- **Organize by business domain** — `intermediate/trading/`, `intermediate/risk/`, `intermediate/finance/`
- **Re-grain strategically** — fan out (session → events) or collapse (events → daily summary) as needed
- **Isolate complexity** — break heavy transforms into multiple intermediate models for testability
- **Push joins and complexity here** — keep marts clean and performant

### Mart Layer Best Practices

- **Group by stakeholder** — `mart_trading/`, `mart_risk/`, `mart_finance/`
- **Never duplicate business logic** — don't create `finance_orders` and `marketing_orders` with different logic for the same concept. One canonical model, multiple Looker explores
- **Align names with business terms** — `fact_order_execution`, `dim_instrument`, not internal/technical names
- **Minimize joins** — push join complexity into intermediate layer, marts should be wide and denormalized
- **Materialize as tables** — marts are queried by Looker, need fast performance
- **Use incremental** only when table rebuild time is too slow

### Materialization

| Type | Data Stored? | Query Speed | When to Use |
|---|---|---|---|
| **View** | No (virtual) | Slower (recomputed on query) | Staging models, light transforms, few downstream consumers |
| **Ephemeral** | No (inlined as CTE) | N/A (not queryable directly) | Lightweight transforms that shouldn't be exposed to end users |
| **Table** | Yes (physical) | Fast | Heavy aggregations, marts queried by BI tools, models with multiple descendants |
| **Incremental** | Yes (append/merge) | Fast | Append-heavy history tables — use `is_incremental()` macro |
| **Materialized View** | Yes (auto-refreshed) | Fast | Frequently-run aggregations on large tables, BigQuery auto-refreshes when base tables change |

**Decision guide:**
- Default to **view** — override only when needed
- Switch to **table** when: build time is acceptable AND the model is queried by Looker or has >2 downstream models
- Switch to **incremental** when: table build time exceeds acceptable threshold (minutes → hours)
- Use **ephemeral** for: simple renames, casts, or filters that are only used by one downstream model
- Incremental adds complexity (merge logic, late-arriving data) — don't use unless table materialization is too slow

### YAML Key Order (_model.yml)

```yaml
- name: model_name
  description: "One row per [entity] — [purpose]"
  config:
    meta:
      contains_pii: no
      owner: "@data-engineering"
  data_tests: [...]
  columns: [...]
```

### PII Classification

- Every model touching personal data must set `contains_pii: yes` in `config.meta`
- When in doubt, set `yes`
- PII classification chain must be consistent across:
  1. Protobuf annotations (`toknapp/contracts`)
  2. dbt `config.meta` (`data-and-analytics`)
  3. BigQuery column labels

### Tests & Data Quality

Tests catch silent failures — pipelines that run successfully but produce wrong, stale, or malformed data. Every model must have tests. Tests also serve as documentation of what the data should look like.

**Minimum tests per model:**
- `unique` + `not_null` on primary key (every model, no exceptions)
- `accepted_values` for enum/status columns
- `relationships` for foreign keys (referential integrity)

**Data freshness (detect stale data):**
```yaml
# sources.yml — source freshness monitoring
sources:
  - name: etl
    tables:
      - name: raw_orders
        loaded_at_field: _PARTITIONTIME
        freshness:
          warn_after: { count: 6, period: hour }
          error_after: { count: 12, period: hour }
```
Run with: `dbt source freshness` — the data-engineer owns freshness checks at the staging layer.

**Data quality tests by layer:**

| Layer | Required Tests | Purpose |
|---|---|---|
| Staging (`stg_*`) | unique, not_null on PK; source freshness | Catch upstream schema changes, stale data |
| Intermediate (`int_*`) | unique on PK; row count checks after grain changes | Catch join explosions, dedup failures |
| Mart (`mart_*`) | unique, not_null on PK; accepted_values; relationships; custom business rules | Prevent bad data in Looker/reports |

**Unit tests (logic validation):**
```yaml
# _unit_test.yml — test business logic, NOT in _model.yml
unit_tests:
  - name: test_order_total_calculation
    model: int_order_summary
    given:
      - input: ref('stg_entities__order')
        rows:
          - { order_id: 1, quantity: 3, unit_price: 10.00 }
    expect:
      rows:
        - { order_id: 1, total_amount: 30.00 }
```
Unit tests validate transformation logic with known input → expected output. Place in `_unit_test.yml`, never in `_model.yml`.

**Custom data tests (singular tests):**
```sql
-- tests/assert_positive_order_amounts.sql
-- Fails if any mart order has a negative total
select order_id, total_amount
from {{ ref('mart_trading__fact_orders') }}
where total_amount < 0
```

**What to test for:**
- Freshness: is there recently created data? (most common silent failure)
- Uniqueness: are primary keys actually unique after transforms?
- Nulls: are required fields populated?
- Range: are values within expected bounds? (e.g., prices > 0, dates not in the future)
- Referential integrity: do foreign keys point to existing records?
- Row counts: did a grain change accidentally multiply or drop rows?
- Business rules: do calculated fields match expected logic?

### Exposures (track downstream consumers)

Exposures document which reports, dashboards, and applications depend on your dbt models. This enables impact analysis before changes.

```yaml
# models/marts/mart_trading/_exposures.yml
exposures:
  - name: trading_dashboard
    label: Trading Operations Dashboard
    type: dashboard
    maturity: high
    url: https://looker.internal.upvest.io/dashboards/trading-ops
    description: >
      Daily trading volume, execution rates, and settlement status.
    depends_on:
      - ref('mart_trading__fact_order_execution')
      - ref('mart_trading__dim_instrument')
    owner:
      name: Data Analytics
      email: data-analytics@upvest.co

  - name: risk_fifo_pipeline
    label: FIFO P&L Cloud Run Job
    type: application
    maturity: high
    depends_on:
      - ref('mart_risk__peak_fractional_pnl')
    owner:
      name: Data Engineering
      email: data-engineering@upvest.co
```

**Rules:**
- Add an exposure for every Looker dashboard and Cloud Run job that reads from marts
- Set `maturity: high` for production dashboards, `medium` for internal, `low` for experimental
- `type`: `dashboard` (Looker), `application` (Cloud Run jobs, APIs), `analysis` (ad-hoc notebooks)
- Exposures appear in dbt docs lineage graph — shows full path from source to consumer

### Deprecated Properties (never use)

`constraints`, `latest_version`, `deprecation_date`, `time_spine`, `versions`

### dbt Project Workflow Best Practices

**Always use `ref()` and `source()`:**
```sql
-- GOOD — dbt infers dependencies, builds in correct order
select * from {{ ref('stg_entities__order') }}
select * from {{ source('etl', 'raw_orders') }}

-- BAD — direct table reference (breaks dependency graph, ignores environment)
select * from `dta-bq-live-914e.etl.raw_orders`
```

**Limit raw data references to staging layer:**
- Raw data (`source()`) should only appear in `stg_*` models
- All downstream models use `ref()` to staging or intermediate models
- Rename and recast fields once in staging — all downstream models inherit clean names

**Break complex models into smaller pieces when:**
- A CTE is duplicated across multiple models → extract to its own model
- A CTE changes the grain (what one row represents) → separate model for independent testing
- The SQL exceeds ~200 lines → split for cognitive load reduction

**Organize models in directories:**
```
dbt/models/
├── staging/          # stg_* — 1:1 with sources, owned by data-engineer
│   ├── orders/
│   └── payments/
├── intermediate/     # int_* — cross-source joins, business logic prep
│   └── trading/
└── marts/            # mart_* — business-facing facts and dimensions
    ├── mart_trading/
    └── mart_risk/
```
- Configure groups of models via `dbt_project.yml` directory configs
- Run subsections: `dbt run -s staging.orders`
- Enforce dependency rules: marts select only from marts, intermediate, or staging — never from `etl.*`

**Development vs. production:**
- Use `dev` target locally, `prod` target in CI/CD only
- Limit data in dev to speed up iteration:
  ```sql
  select *
  from {{ source('etl', 'events') }}
  {% if target.name == 'dev' %}
  where created_at >= date_sub(current_date(), interval 3 day)
  {% endif %}
  ```

**Slim builds — minimize unnecessary model rebuilds:**

The goal is to rebuild models as infrequently as possible. If your dbt costs are high, you may be rebuilding too much, not that your models are slow.

*Persist artifacts after production runs:*
```bash
# After successful production dbt build, persist manifest for state comparison
gsutil cp target/manifest.json gs://dbt-artifacts/manifest.json
gsutil cp target/sources.json gs://dbt-artifacts/sources.json

# Before any slim build, download latest artifacts
gsutil -m rsync gs://dbt-artifacts/ .state/
```

*Slim CI — run only modified models:*
```bash
# Build only changed models + downstream, defer unchanged refs to production
dbt run -s state:modified+ --defer --state .state
dbt test -s state:modified+ --defer --state .state

# Smart reruns — modified + previously failed
dbt build --select state:modified+ result:error+ --defer --state .state

# Source freshness-driven builds — only rebuild downstream of fresher sources
dbt source freshness
dbt build --select source_status:fresher+ --state .state
```

*Slim local development — don't rebuild the world:*
```bash
# --defer: reuse production tables for upstream refs you haven't changed
# Only builds model_c locally, refs to model_a/model_b point to production
dbt run -s model_c --defer --state .state

# --empty: schema-only dry run (injects LIMIT 0 into all refs/sources)
# Validates SQL compiles and dependencies resolve, without processing data
dbt run -s my_model --empty
```

*Limit data in dev (target-aware filtering):*
```sql
select *
from {{ source('etl', 'events') }}
{% if target.name == 'dev' %}
where created_at >= date_sub(current_date(), interval 3 day)
{% endif %}
```

**`--defer` rules:**
- Always start from an **empty dev schema** — if refs exist locally, dbt uses those instead of deferring
- Defer reuses production tables via fully-qualified references — no cloning needed
- Works with `dbt run`, `dbt build`, `dbt test`

**Use `grants` for permissions:**
```yaml
# dbt_project.yml — apply grants to all models in a directory
models:
  my_project:
    marts:
      +grants:
        select: ['looker_service_account@upvest.co']
```

---

## SQL Review Checklist

When reviewing SQL code, check for:

- [ ] **JOIN explosion**: Unintended many-to-many joins producing row multiplication
- [ ] **NULL handling**: Explicit `COALESCE`/`IFNULL` — no implicit NULL arithmetic
- [ ] **Window function performance**: Unbounded windows (`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`) on large tables
- [ ] **Type coercion**: Implicit casts that silently lose precision (e.g., FLOAT64 for monetary amounts)
- [ ] **Partition pruning**: Queries filtering on partition column to avoid full scans
- [ ] **PII exposure**: No SELECT * on PII tables — select only non-PII columns or aggregate
- [ ] **Decimal precision**: Use `NUMERIC` or `BIGNUMERIC` for monetary amounts — never `FLOAT64`
- [ ] **Deterministic ordering**: `ORDER BY` includes enough columns to be deterministic
- [ ] **Timezone handling**: All timestamps UTC — explicit conversion when needed

---

## PII-Safe Query Patterns

```sql
-- Never do this
SELECT * FROM `project.dataset.users` LIMIT 10

-- Select only non-PII columns
SELECT user_id, created_at, account_status FROM `project.dataset.users` LIMIT 10

-- Aggregate instead of raw rows
SELECT account_status, COUNT(*) as cnt FROM `project.dataset.users` GROUP BY 1

-- Anonymize identifiers
SELECT FARM_FINGERPRINT(email) as email_hash, created_at FROM `project.dataset.users` LIMIT 10
```

---

## Common BigQuery Patterns

### Date/Time

```sql
-- Current date in UTC
CURRENT_DATE()

-- Date arithmetic
DATE_ADD(CURRENT_DATE(), INTERVAL -7 DAY)

-- Partition filter
WHERE DATE(_PARTITIONTIME) >= DATE_ADD(CURRENT_DATE(), INTERVAL -30 DAY)

-- Business day check (approximate — no built-in business calendar)
WHERE EXTRACT(DAYOFWEEK FROM date_column) NOT IN (1, 7)
```

### Deduplication

```sql
-- Deduplicate by entity ID, keep latest
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY updated_at DESC) as rn
  FROM `project.dataset.table`
) WHERE rn = 1
```

### Deduplication (dbt standard)

```sql
QUALIFY ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY updated_at DESC) = 1
```

### Safe Division (mandatory)

```sql
-- Always use SAFE_DIVIDE — never bare division
SAFE_DIVIDE(numerator, denominator)
```

### BigQuery-Specific dbt Configurations

**Partitioning** — divide tables for faster queries and cost savings:
```sql
{{
  config(
    materialized='table',
    partition_by={
      "field": "created_at",
      "data_type": "timestamp",
      "granularity": "day"
    }
  )
}}
```

**Clustering** — sort rows for filtered/aggregated queries:
```sql
{{
  config(
    materialized='table',
    cluster_by=["tenant_id", "instrument_id"]
  )
}}
```

**Incremental with `insert_overwrite`** — fastest/cheapest BigQuery incremental strategy. Replaces entire partitions instead of scanning all rows:
```sql
{% set partitions_to_replace = [
  'timestamp(current_date)',
  'timestamp(date_sub(current_date, interval 1 day))'
] %}

{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by={"field": "created_at", "data_type": "timestamp"},
    partitions=partitions_to_replace
  )
}}

select *
from {{ source('etl', 'raw_table') }}
{% if is_incremental() %}
  where _PARTITIONTIME > (select max(_PARTITIONTIME) from {{ this }})
{% endif %}
```

**Standard incremental (merge)** — use when `insert_overwrite` isn't suitable (e.g., updates to existing rows). Requires `unique_key`:
```sql
{{
  config(
    materialized='incremental',
    unique_key='entity_id',
    on_schema_change='sync_all_columns'
  )
}}
```

**Incremental strategy comparison:**

| Strategy | How It Works | Speed | Cost | When to Use |
|---|---|---|---|---|
| `insert_overwrite` | Replaces entire partitions | Fastest | Cheapest | Append-only/event data, partitioned tables |
| `merge` (default) | Scans all source + dest rows | Slower | More expensive | When rows need updating (CDC, upserts) |

**Timeouts** — set in `profiles.yml` to prevent runaway queries:
```yaml
# profiles.yml
my_project:
  target: prod
  outputs:
    prod:
      type: bigquery
      job_execution_timeout_seconds: 300   # 5 min max per query
      job_retries: 1                        # retry once on transient failure
    dev:
      type: bigquery
      job_execution_timeout_seconds: 120   # shorter for dev
      job_retries: 0                        # no retries in dev
```

**TABLESAMPLE** — reduce data processed in dev (BigQuery-specific):
```sql
select *
from {{ ref('stg_entities__order') }}
{% if target.name == 'dev' %}
  tablesample system (10 percent)
{% endif %}
```
Unlike `LIMIT`, `TABLESAMPLE` prevents BigQuery from reading the full table — saves compute cost in development.

### MERGE (upsert in staging)

```sql
MERGE `project.dataset.target` T
USING `project.dataset.source` S
ON T.entity_id = S.entity_id
WHEN MATCHED THEN UPDATE SET T.col1 = S.col1, T.updated_at = S.updated_at
WHEN NOT MATCHED THEN INSERT (entity_id, col1, updated_at) VALUES (S.entity_id, S.col1, S.updated_at)
```

---

## When to Consult This Reference

- Writing or reviewing any SQL or dbt model
- Querying BigQuery for analysis or investigation
- Reviewing dbt model descriptions and conventions
- Checking PII-safe query patterns

For staging models: consult `upvest-data-engineer`.
For intermediate/mart models: consult `upvest-data-analytics-engineer`.
For SQL performance optimization: see also `rules/design-patterns.md` and `rules/bigquery-cli.md`.
