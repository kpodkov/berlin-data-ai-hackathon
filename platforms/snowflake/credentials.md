# Snowflake Access

## Connection

- **Account URL**: `https://<ACCOUNT_ID>.snowflakecomputing.com`
- **Login**: your email address
- **Password**: communicated on-site

You can connect via:

- **Snowsight** — Snowflake's web UI (recommended for getting started). Go to the account URL and log in.
- **Snow CLI** — Snowflake's command-line tool. See [programmatic-access.md](programmatic-access.md) for setup and usage.
- **Python** — `snowflake-connector-python` or `snowflake-sqlalchemy`. See [programmatic-access.md](programmatic-access.md#python) for examples.
- **Any JDBC/ODBC client** — DBeaver, DataGrip, etc.

## Your Team Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Team database | `DB_TEAM_<N>` | Your workspace — create schemas, tables, views |
| Shared data | `DB_JW_SHARED.CHALLENGE` | Read-only — all event + lookup tables |

## Warehouses (Compute)

Each team has three warehouses. A warehouse is Snowflake's compute engine — it runs your queries.

| Warehouse | Size | Credits/hr | Use for |
|-----------|------|------------|---------|
| `WH_TEAM_<N>_XS` | X-Small | 1 | Default — exploration, T1/T2 queries, prototyping |
| `WH_TEAM_<N>_S` | Small (2x XS) | 2 | Scanning tens of millions of rows, T3 queries |
| `WH_TEAM_<N>_M` | Medium (4x XS) | 4 | Large queries on T3/T4, complex joins, heavy aggregations |

**How billing works:** You're only charged while a warehouse is actively running a query. All warehouses auto-suspend after 60 seconds of idle time and auto-resume when you run your next query. There is no charge while suspended.

**Recommendation:** Start with XS. If a query takes more than 30 seconds, try S. Only use M for T3/T4 or complex multi-table joins.

```sql
-- Set your warehouse
USE WAREHOUSE WH_TEAM_1_XS;  -- replace with your team number

-- Switch to a bigger one if needed
USE WAREHOUSE WH_TEAM_1_S;
```

## Quick Start

```sql
USE WAREHOUSE WH_TEAM_1_XS;

-- Explore the data
SELECT * FROM DB_JW_SHARED.CHALLENGE.T1 LIMIT 100;
SELECT * FROM DB_JW_SHARED.CHALLENGE.OBJECTS LIMIT 10;
SELECT * FROM DB_JW_SHARED.CHALLENGE.PACKAGES LIMIT 20;

-- Your team database
USE DATABASE DB_TEAM_1;
CREATE SCHEMA IF NOT EXISTS my_analysis;
CREATE TABLE my_analysis.my_first_table AS
SELECT * FROM DB_JW_SHARED.CHALLENGE.T1 WHERE se_category = 'clickout';
```
