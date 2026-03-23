# Repository Access Protocol

> How Upvest agents access source code repositories.
> Agents operate agnostic of the local machine — use `toknapp/<repo>` references, not local paths.

---

## Repository Registry

All Upvest repositories are under the `toknapp` GitHub organization.

| Repository | Domain | Primary Agent(s) |
|---|---|---|
| `toknapp/data-and-analytics` | dbt models, analytics | data-engineer, data-analytics-engineer, data-analyst |
| `toknapp/data-platform` | kroute, Liquibase, ETL | data-engineer, data-engineer |
| `toknapp/data-workloads` | Cloud Run batch jobs | data-engineer, python-developer |
| `toknapp/data-export` | Client data exports | data-analyst, data-engineer |
| `toknapp/contracts` | Protobuf definitions | go-developer, product-engineer |
| `toknapp/infrastructure` | Terraform/Terragrunt IaC | platform-engineer |
| `toknapp/platform-bootstrap` | GCP org bootstrap | platform-engineer |
| `toknapp/kubernetes` | Product service K8s manifests | product-engineer |
| `toknapp/kubernetes-platform` | ArgoCD, platform components | platform-engineer |
| `toknapp/kubernetes-data-platform` | Data platform K8s | platform-engineer, data-engineer |
| `toknapp/kubernetes-ops` | Ops service K8s | platform-engineer, ops-tooling |
| `toknapp/kubernetes-engen-delivery` | Eng delivery K8s | platform-engineer |
| `toknapp/engineering-platform` | EP Terragrunt IaC | platform-engineer |
| `toknapp/software-delivery-solution` | SDS Go monorepo | platform-engineer |
| `toknapp/confluent-cloud-kafka` | Kafka topic Crossplane CRs | data-engineer |
| `toknapp/hauptf` | Product services (Go) | product-engineer, go-developer |
| `toknapp/actions` | GitHub Actions | cicd-engineer |
| `toknapp/looker-upvest` | LookML definitions | data-analyst |
| `toknapp/bigquery_permissions` | BigQuery IAM (YAML) | data-engineer, security-engineer |

---

## Access Protocol

### Priority 1: Cloned Repository (preferred)
If the repository is cloned locally, use it directly:
```bash
# Check if repo is cloned
ls ~/repo/<repo-name> 2>/dev/null || ls /Users/*/repo/<repo-name> 2>/dev/null || ls /mnt/*/Development/repo/<repo-name> 2>/dev/null
```

### Priority 2: Git Clone (for sustained work)
If the repo is not cloned but you need multiple files:
```bash
git clone git@github.com:toknapp/<repo-name>.git ~/repo/<repo-name>
cd ~/repo/<repo-name>
```

### Priority 3: Single File via GitHub API (for quick lookups)
If you only need one file and the repo is not cloned:
```bash
# Use gh CLI (preferred — respects existing auth)
gh api repos/toknapp/<repo-name>/contents/<path/to/file> --jq '.content' | base64 -d

# Or use curl with gh auth token
curl -sH "Authorization: token $(gh auth token)" \
  "https://api.github.com/repos/toknapp/<repo-name>/contents/<path/to/file>" | \
  jq -r '.content' | base64 -d
```

### Priority 4: Browse via GitHub API (for directory listings)
```bash
gh api repos/toknapp/<repo-name>/contents/<path/to/directory> --jq '.[].name'
```

---

## Authentication

- **Assume local git is authenticated** — SSH keys or GitHub CLI (`gh`) are already configured
- **Never attempt to authenticate yourself** — if a command fails due to auth, stop and ask the user
- **Never run `gh auth login`** — the user manages their own credentials
- **Never store or echo tokens** — use `$(gh auth token)` inline only

---

## Repository References in Agent Files

When referencing repositories in agent definitions or documentation:
- Use `toknapp/<repo-name>` format (e.g., `toknapp/data-and-analytics`)
- Never use local absolute paths like `/Users/kirill/repo/...` or `/mnt/e/Development/repo/...`
- When describing file paths within a repo, use repo-relative paths (e.g., `dbt/models/staging/`)

---

## Branch Conventions

| Branch | Purpose | Deployment |
|---|---|---|
| `main` | Default branch for most repos | CI runs on push |
| `next` | Production deployment branch (K8s repos) | ArgoCD syncs to sandbox/live |
| Feature branches | Development work | CI runs on PR |
| `config` | Configuration branch (SDS) | Team/user config |
