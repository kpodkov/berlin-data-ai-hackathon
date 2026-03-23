---
name: investigate
description: Structured incident investigation using Datadog logs/metrics, Linear tickets, and BigQuery CLI. Use when investigating data pipeline issues, stale sources, consumer lag, or production alerts.
argument-hint: <ticket-or-description>
context: fork
agent: general-purpose
---

Investigate the issue described in `$ARGUMENTS`.

## Investigation Protocol

### Step 1: Gather Context
- If a Linear ticket ID is provided (e.g., DATA-529), fetch ticket details via Linear MCP
- Identify the affected system: Kafka pipeline, dbt model, Cloud Run job, BigQuery table, or Looker dashboard

### Step 2: Check Observability
- Query Datadog MCP for relevant metrics and logs:
  - Consumer lag for Kafka-related issues
  - Cloud Run job execution status and error logs
  - Service health metrics
- Check BigQuery table freshness via CLI:
  ```bash
  bq query --use_legacy_sql=false 'SELECT MAX(_PARTITIONTIME) as latest, TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), MAX(_PARTITIONTIME), MINUTE) as minutes_behind FROM `project.dataset.table`'
  ```
- Check source freshness in dbt if applicable

### Step 3: Root Cause Analysis
Think step by step:
1. What component failed? (Kafka consumer, BigQuery write, dbt model, Cloud Run job)
2. Is this transient (retry-safe) or persistent?
3. Most likely root causes (schema mismatch, credential expiry, resource exhaustion, data issue)
4. What downstream consumers are impacted? (mart freshness, Looker dashboards, exports)

### Step 4: Report
Return a structured summary:
- **Issue**: One-line description
- **Root cause**: What went wrong and why
- **Impact**: What's affected downstream
- **Fix**: Recommended remediation steps
- **Prevention**: How to prevent recurrence

## Tools Available
- Datadog MCP: metrics, logs, monitors
- Linear MCP: ticket context
- BigQuery CLI (`bq`): table inspection, freshness queries (see `rules/bigquery-cli.md`)
- gcloud CLI: Cloud Run job status, logs (see `rules/gcloud-cli.md`)
- Confluent CLI: consumer lag, topic inspection (see `rules/confluent-cli.md`)

## Rules
- Never run DDL/DML against production — read-only inspection only
- Never SELECT * from PII tables
- See `rules/operational-constraints.md` for production safety
