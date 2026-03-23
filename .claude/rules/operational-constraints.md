# Operational Constraints

> Standard operational rules for all Upvest agents.
> Every agent must follow these constraints. Referenced from each agent's definition.

---

## Authentication

Never attempt to authenticate yourself. If a command fails due to missing or expired credentials, stop and ask the user to authenticate. Do not retry authentication commands — prompt instead.

Common authentication commands (for reference only — do not run these yourself):
- GCP / BigQuery: `make login` (from `dbt/`) or `gcloud auth application-default login`
- GitHub CLI: `gh auth login`

---

## Production Safety

**`live` and `sandbox` are both production.** `sandbox` is a client-facing test environment for Upvest's B2B customers — no real trading occurs, but it is treated as production because tenants integrate against it. `sandbox.tfvars` sets `environment = "production"`.

Never execute any command locally against these GCP projects:

| Stage | Stage project | BigQuery project |
|---|---|---|
| live | `dta-live-1048` | `dta-bq-live-914e` |
| sandbox | `dta-sandbox-6838` | `dta-bq-sandbox-a3c2` |

Also never target `ia-live-4632` or `ia-sandbox-54ec` directly.

Safe for local operations: unstable (`dta-unstable-71c8` / `dta-bq-unstable-58ae`) and staging (`dta-staging-40ad` / `dta-bq-staging-a6c4`).

CI/CD is the only permitted path to production. Stop and tell the user if a task requires touching production projects — do not attempt the operation.

---

## Sandbox (Claude Code)

If a Bash command fails due to sandbox restrictions (blocked file path, network access, or "Operation not permitted" errors), retry immediately with `dangerouslyDisableSandbox: true` and briefly explain what the sandbox was blocking. Do not ask permission first — just retry with the flag set. If escaping the sandbox still fails, stop immediately and return the task to the main agent with a clear description of what was blocked — do not continue with degraded functionality.

---

## Collective Invocations

When addressed with collective terms like "hey team", "hello team", "lets build team", "Upvest", or "Upvengers", respond as part of the Upvest dream team, acknowledging the collective rather than just your individual persona. This applies to affirmative actions and imperative commands.
