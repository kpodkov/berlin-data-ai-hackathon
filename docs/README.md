# docs/

Documentation for the FRED → Snowflake → dbt → Lightdash pipeline.

## Structure

```
docs/
├── guides/              # How-to guides — step-by-step instructions for doing things
│   ├── snowflake/       # Snowflake setup, ingestion, connections
│   ├── dbt/             # dbt project setup, model development, testing
│   ├── lightdash/       # Lightdash setup, dashboards, deployment
│   └── data-sources/    # How to connect and pull from specific data sources
│
├── plans/               # Implementation plans — what we're building and the steps to get there
│                        # Mutable working documents. Checked off as work progresses.
│
├── research/            # Research and analysis — raw findings, API docs, source evaluations
│                        # Input material that informs plans and guides.
│
└── reference/           # Reference docs — specs, schemas, config formats, platform capabilities
                         # Lookup material, not meant to be read end-to-end.
```

## Category Definitions

| Category | What goes here | Examples |
|---|---|---|
| **guides/** | Step-by-step instructions for accomplishing a task. Written for a human (or agent) following along. | "How to load CSVs into Snowflake", "How to set up Lightdash locally" |
| **plans/** | Implementation plans with tasks, dependencies, and checkboxes. Living documents that track progress. | "FRED pipeline build plan", "dbt model layer plan" |
| **research/** | Raw research output — API docs, source comparisons, feasibility analysis. Informs plans but doesn't prescribe actions. | "FRED API capabilities", "EU economic data source survey" |
| **reference/** | Lookup material — platform features, YAML specs, schema definitions. Consulted during implementation, not read sequentially. | "Snowflake platform features", "Lightdash YAML reference" |

## Current Contents

### guides/
- `snowflake/ingestion.md` — How to load CSV data into Snowflake (UI, CLI, Python, Snowpark)
- `lightdash/getting-started.md` — Lightdash setup and first dashboard
- `lightdash/developer-guides.md` — Lightdash development workflows
- `lightdash/self-hosting.md` — Self-hosting Lightdash

### plans/
- `econ-data-snowflake-pipeline.md` — DAG-annotated implementation plan for the full FRED → Snowflake pipeline

### research/
- `fred-api-and-ingestion.md` — FRED API endpoints, Python clients, ingestion patterns, schema design
- `eu-german-economic-data-sources.md` — Survey of ECB, Eurostat, Bundesbank, Destatis, OECD, BIS, IMF

### reference/
- `snowflake-platform-features.md` — Snowflake connectors, Snowpark, Snowpipe, security, data sharing
- `lightdash-yaml.md` — Lightdash YAML configuration reference
- `lightdash-integrations-and-permissions.md` — Lightdash integrations and access control
- `hackathon-user-profiling-session.md` — Hackathon Team 3 user segmentation session summary
