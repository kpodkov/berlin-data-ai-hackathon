# gcloud CLI Reference

> Safe gcloud operations for Upvest agents.
> Agents may use `gcloud` to inspect resources, read logs, check status, and query metadata.
> **Never create, delete, or modify production resources. Never authenticate yourself.**

---

## GCP Regions

| Region | Purpose |
|---|---|
| `europe-west3` (Frankfurt) | **Primary** — all GKE clusters, Cloud Run, Cloud Scheduler, Artifact Registry |
| `europe-west4` (Netherlands) | **Failover** — disaster recovery, secondary region |
| `EU` (multi-region) | **BigQuery only** — datasets use EU multi-region for availability |

Always use `--region=europe-west3` unless targeting BigQuery (which uses `--location=EU`).

---

## Authentication

- Assume `gcloud` is already authenticated — never run `gcloud auth login` yourself
- If a command fails due to auth, stop and ask the user to authenticate
- Never run `gcloud auth application-default login` — the user manages credentials
- Never print, echo, or store access tokens outside of inline subshell usage

---

## Project Safety Reference

| Stage | Project ID | Agent Access |
|---|---|---|
| unstable | `dta-unstable-71c8` / `dta-bq-unstable-58ae` | Safe — read and inspect freely |
| staging | `dta-staging-40ad` / `dta-bq-staging-a6c4` | Safe — read and inspect freely |
| sandbox | `dta-sandbox-6838` / `dta-bq-sandbox-a3c2` | **Production** — read-only inspection |
| live | `dta-live-1048` / `dta-bq-live-914e` | **Production** — read-only inspection |

Also never target `ia-live-4632` or `ia-sandbox-54ec` directly.

> **sandbox context**: `sandbox` is Upvest's client-facing test environment for B2B customers. No real trading occurs, but tenants integrate against it — treat as production.

---

## Safe Operations

### Project & Config
```bash
# Check current project
gcloud config get-value project

# List available projects
gcloud projects list --filter="projectId:dta-*"

# Temporarily target a different project (does not change default)
gcloud --project=dta-bq-unstable-58ae <command>
```

### GKE Clusters
```bash
# List clusters
gcloud container clusters list --project=PROJECT_ID

# Get cluster credentials (for kubectl access)
gcloud container clusters get-credentials CLUSTER_NAME --region=REGION --project=PROJECT_ID

# Describe cluster (check version, node pools, status)
gcloud container clusters describe CLUSTER_NAME --region=REGION --project=PROJECT_ID --format=json
```

### Cloud Run Jobs
```bash
# List Cloud Run jobs
gcloud run jobs list --project=PROJECT_ID --region=europe-west3

# Describe a job (config, schedule, last execution)
gcloud run jobs describe JOB_NAME --project=PROJECT_ID --region=europe-west3

# List executions of a job
gcloud run jobs executions list --job=JOB_NAME --project=PROJECT_ID --region=europe-west3

# Get logs from a job execution
gcloud run jobs executions logs read EXECUTION_NAME --project=PROJECT_ID --region=europe-west3
```

### Cloud Logging
```bash
# Read recent logs (last 1 hour)
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="JOB_NAME"' \
  --project=PROJECT_ID --limit=50 --format=json --freshness=1h

# Read logs with severity filter
gcloud logging read 'severity>=ERROR' --project=PROJECT_ID --limit=20 --format=json --freshness=1h

# Read GKE pod logs
gcloud logging read 'resource.type="k8s_container" AND resource.labels.container_name="CONTAINER"' \
  --project=PROJECT_ID --limit=50 --format=json --freshness=1h

# Read logs for a specific service
gcloud logging read 'resource.labels.service_name="SERVICE_NAME"' \
  --project=PROJECT_ID --limit=30 --format=json
```

### Secret Manager (read-only)
```bash
# List secrets
gcloud secrets list --project=PROJECT_ID

# Get secret metadata (NOT the value)
gcloud secrets describe SECRET_NAME --project=PROJECT_ID

# List secret versions
gcloud secrets versions list SECRET_NAME --project=PROJECT_ID

# NOTE: Never access secret values (gcloud secrets versions access) unless explicitly asked
```

### Cloud Scheduler
```bash
# List scheduled jobs
gcloud scheduler jobs list --project=PROJECT_ID --location=europe-west3

# Describe a scheduled job (cron schedule, target, status)
gcloud scheduler jobs describe JOB_NAME --project=PROJECT_ID --location=europe-west3

# Check last run status
gcloud scheduler jobs describe JOB_NAME --project=PROJECT_ID --location=europe-west3 --format="table(name,state,schedule,lastAttemptTime,status.code)"

# NOTE: Never create, update, pause, resume, or delete scheduler jobs — those go through Terraform
```

### IAM
```bash
# List IAM policy for a project
gcloud projects get-iam-policy PROJECT_ID --format=json

# List service accounts
gcloud iam service-accounts list --project=PROJECT_ID

# Get IAM policy for a service account
gcloud iam service-accounts get-iam-policy SA_EMAIL --project=PROJECT_ID
```

### Artifact Registry (container images)
```bash
# List images
gcloud artifacts docker images list europe-docker.pkg.dev/upvest-registry/registry --include-tags

# Describe an image
gcloud artifacts docker images describe europe-docker.pkg.dev/upvest-registry/registry/IMAGE:TAG
```

### Compute & Network (inspection only)
```bash
# List VPC networks
gcloud compute networks list --project=PROJECT_ID

# List firewall rules
gcloud compute firewall-rules list --project=PROJECT_ID

# Describe a network
gcloud compute networks describe NETWORK_NAME --project=PROJECT_ID
```

### Monitoring (metrics)
```bash
# List monitored resource types
gcloud monitoring resource-descriptors list --project=PROJECT_ID --limit=20

# List alerting policies
gcloud alpha monitoring policies list --project=PROJECT_ID
```

---

## Restricted Operations (never use without explicit user instruction)

### Never Do These
- **Never create resources** — `gcloud * create`, `gcloud run deploy`, `gcloud container clusters create`
- **Never delete resources** — `gcloud * delete`
- **Never modify IAM** — `gcloud projects add-iam-policy-binding`, `gcloud iam *`
- **Never access secret values** — `gcloud secrets versions access` (unless explicitly asked by user)
- **Never modify configs** — `gcloud config set project` on production projects
- **Never deploy** — `gcloud run deploy`, `gcloud app deploy`
- **Never authenticate** — `gcloud auth login`, `gcloud auth application-default login`

### Production Safety
For production projects (sandbox, live), limit to:
- `gcloud * list` — list resources
- `gcloud * describe` — inspect resource details
- `gcloud logging read` — read logs
- `gcloud run jobs executions list` — check job status

---

## Useful Flags

| Flag | Purpose |
|---|---|
| `--format=json` | Machine-readable output, pipe to `jq` |
| `--format="table(name,status)"` | Custom table columns |
| `--filter="name:prefix-*"` | Server-side filtering |
| `--limit=N` | Limit results |
| `--project=PROJECT_ID` | Target specific project without changing default |
| `--region=europe-west3` | Upvest primary region |
| `--freshness=1h` | Log recency for `gcloud logging read` |
| `--quiet` | Suppress prompts |
