# Pipeline Workflows

> Reusable workflow templates for common Upvest multi-agent tasks.
> Agents follow these pipelines for structured, repeatable work with human checkpoints.
> See `rules/agent-collaboration.md` for HITL checkpoints and escalation paths.

---

## Workflow A: Feature Implementation

```
planner → [HITL: approve plan] → specialist agent(s) → code-reviewer → [HITL: approve PR]
```

| Stage | Agent | Input | Output | Definition of Done |
|---|---|---|---|---|
| 1. Plan | planner | Feature request or Linear ticket | PLAN.md committed to repo | Plan written, human approved, Linear ticket linked |
| 2. Implement | specialist (go-developer, python-developer, analytics-engineer, etc.) | Approved PLAN.md | Code changes + tests | Code compiles, tests pass, linting clean |
| 3. Review | code-reviewer | git diff of changes | Review findings | All critical/high findings addressed, no PII exposure |
| 4. PR | human | Review summary | Merged PR | Human approves, CI green, PR merged |

**When to use**: New features, bug fixes, refactors that touch code.

**HITL gates**:
- After stage 1: Human reviews plan before implementation starts
- After stage 3: Human reviews code reviewer findings before PR

---

## Workflow B: Data Model Pipeline

```
data-engineer (staging) → data-analytics-engineer (intermediate/mart) → data-analyst (Looker) → [HITL: verify]
```

| Stage | Agent | Input | Output | Definition of Done |
|---|---|---|---|---|
| 1. Staging | data-engineer | New Kafka topic or schema change | `stg_*` model + `sources.yml` | sqlfluff passes, source freshness configured, 1:1 with source |
| 2. Mart | data-analytics-engineer | Staging model ready | `int_*` / `mart_*` models + `_model.yml` | Elementary DQ tests pass, descriptions written, PII flagged |
| 3. Looker | data-analyst | Mart model ready | LookML view/explore | Dashboard renders correctly, dimensions/measures validated |
| 4. Verify | human | Dashboard or export | Confirmation | Business logic verified against requirements |

**When to use**: New data domains, new Kafka topics landing in BigQuery, new mart tables.

**Linear ticket flow**: `DATA-*` Backlog → In Progress (stage 1) → Review (stage 2) → Done (stage 4)

---

## Workflow C: Infrastructure Change

```
planner → security-engineer (DORA review) → [HITL: approve ADR] → platform-engineer → [HITL: approve apply]
```

| Stage | Agent | Input | Output | Definition of Done |
|---|---|---|---|---|
| 1. Plan | planner | Infrastructure requirement | PLAN.md + scope assessment | Plan written, DORA impact identified |
| 2. Security | security-engineer | PLAN.md | DORA compliance assessment + ADR | Compliance assessed, findings as SENG-* tickets, no critical gaps |
| 3. Implement | platform-engineer | Approved ADR | Terraform/Kustomize changes | `terragrunt plan` clean, `kustomize build` clean, no drift |
| 4. Apply | human | Plan output | Applied changes | Human approves apply, CI/CD deploys, monitoring confirms |

**When to use**: New clusters, IAM changes, network changes, new third-party services.

**HITL gates**:
- After stage 2: Human approves ADR before implementation
- After stage 3: Human approves `terragrunt apply` or ArgoCD sync

---

## Workflow D: Incident Investigation

```
[alert] → specialist agent (Datadog MCP) → security-engineer (if major) → [HITL: remediation approval]
```

| Stage | Agent | Input | Output | Definition of Done |
|---|---|---|---|---|
| 1. Triage | owning agent | Alert or error report | Root cause analysis via Datadog MCP | Root cause identified, blast radius assessed |
| 2. Classify | security-engineer (if major ICT incident) | Triage output | DORA incident classification | Incident classified per DORA Art. 17-23 |
| 3. Remediate | specialist agent | Classification + root cause | Fix proposal | Fix tested in unstable/staging |
| 4. Deploy | human | Fix proposal | Production deployment | Human approves deployment to sandbox/live |

**When to use**: Production alerts, data quality issues, pipeline failures.

---

## How to Invoke a Workflow

Explicitly tell Claude which workflow to follow:

```
Follow Workflow A (Feature Implementation) for DATA-529.
Follow Workflow B (Data Model Pipeline) — new Kafka topic "Reinvestment" needs to land in BigQuery.
Follow Workflow C (Infrastructure Change) — need to add a new GKE node pool.
```

Or let the planner agent recommend the appropriate workflow based on the task.

---

## Definition of Done — Per Agent

These agents have explicit completion criteria when participating in pipeline stages:

### planner
- [ ] PLAN.md written and committed
- [ ] Approach approved by human
- [ ] Linear ticket linked
- [ ] Affected agents and systems identified

### code-reviewer
- [ ] All critical/high findings addressed
- [ ] No PII exposure in code or logs
- [ ] Tests pass
- [ ] DORA change management requirements met

---

## Data Pipeline Engineering Principles

### Upvest uses ELT (not ETL)

| Step | What | Where | Tool |
|---|---|---|---|
| **E**xtract | Pull data from source systems | Kafka topics | Product microservices (gRPC/Protobuf) |
| **L**oad | Land raw data into warehouse | BigQuery `etl.*` tables | kroute (Go, franz-go) |
| **T**ransform | Clean, join, aggregate | BigQuery (in-warehouse) | dbt (staging → intermediate → mart) |

Transforms run inside BigQuery using dbt, not in external systems. This leverages warehouse compute, simplifies the stack, and enables dbt's testing/lineage/documentation.

### Idempotency (mandatory)

Every pipeline step must be safe to run multiple times without producing duplicates or corruption:
- Use **MERGE** (upsert) with stable primary keys for CDC data
- Use **deduplication** with `ROW_NUMBER()` or `QUALIFY` before inserting
- Track processed runs with audit columns (`_loaded_at`, `_batch_id`)
- Design Cloud Run jobs to be re-runnable — check for existing output before writing
- Incremental dbt models must handle late-arriving data correctly

### Batch vs Streaming

| Type | Use When | Upvest Example |
|---|---|---|
| Streaming | Real-time operational data needed | Kafka → kroute → `etl.*` (continuous CDC) |
| Batch (scheduled) | Periodic aggregations, reports | Cloud Run jobs (daily/hourly via Cloud Scheduler) |
| Batch (triggered) | Rebuild after source refresh | dbt runs triggered by source freshness checks |

Most analytics at Upvest is batch — dbt runs on a schedule. Streaming handles only the initial Kafka → BigQuery ingestion via kroute.

### Pipeline Resilience

- **Retries**: Cloud Run jobs have built-in retry config. dbt has no native retry — use orchestrator-level retries
- **Alerts**: Datadog monitors on job failures, consumer lag, source freshness
- **Circuit breakers**: If a source is stale (freshness > threshold), halt downstream processing rather than propagating bad data
- **Backfills**: Design pipelines to support historical reprocessing — never hard-delete raw data

### data-engineer
- [ ] Staging model created and compiles
- [ ] sqlfluff passes with no errors
- [ ] Source freshness configured
- [ ] 1:1 mapping with source table (no business logic)

### data-analytics-engineer
- [ ] Mart model created and compiles
- [ ] Elementary DQ tests pass
- [ ] `_model.yml` descriptions written (grain + purpose)
- [ ] `contains_pii` flag set correctly

### security-engineer
- [ ] DORA compliance assessed for relevant articles
- [ ] Findings logged as `SENG-*` Linear tickets
- [ ] No critical compliance gaps
- [ ] ICT third-party risk evaluated (if applicable)

### platform-engineer
- [ ] `kustomize build` clean
- [ ] `terragrunt plan` clean (no unexpected changes)
- [ ] ArgoCD sync verified
- [ ] No configuration drift
