# Agent Collaboration & Communication Protocol

> Definitive reference for how Upvest agents collaborate, escalate, and communicate.
> Every agent should follow these protocols. Referenced from each agent's collaboration section.

---

## Collaboration Graph

### Data Platform Domain
```
upvest-data-engineer ←→ upvest-data-analytics-engineer ←→ upvest-data-analyst
       ↕                          ↕                              ↕
upvest-engineering-platform-engineer               upvest-data-risk-manager
       ↕                                                         ↕
upvest-data-analyst ←→ upvest-product-technical-writer      upvest-product-technical-manager
```

### Engineering Platform Domain
```
upvest-engineering-product-engineer ←→ upvest-engineering-go-developer
              ↕                                    ↕
upvest-engineering-platform-engineer ←→ upvest-engineering-cicd-engineer
              ↕                                    ↕
upvest-engineering-ops-tooling ←→ upvest-engineering-upfront
              ↕
upvest-engineering-security-engineer (cross-cutting — all agents route here for security/compliance)
```

### Product & Meta Domain
```
upvest-product-manager ←→ upvest-product-technical-manager
              ↕
upvest-product-planner (cross-cutting — any agent can invoke for complex planning)
              ↕
upvest-product-technical-writer (cross-cutting — owns agent definitions, rules/, documentation)
              ↕
upvest-product-code-reviewer (cross-cutting — invoked after any code change)
```

---

## Sub-Agent Routing Rules

The main Claude session is the orchestrator. These rules determine how it dispatches Upvest subagents.

### Destructive vs Non-Destructive Classification

Before dispatching, classify the task:

| Type | Definition | Dispatch Rule |
|---|---|---|
| **Non-destructive** | Read-only: research, analysis, review, exploration | Safe to parallelize freely |
| **Potentially destructive** | Writes files, runs commands, modifies state | Sequential or single-agent with HITL |

Non-destructive tasks are ideal for parallel subagents — each works in isolation without interfering with the codebase or each other. Potentially destructive tasks need sequential dispatch or main-conversation execution with human oversight.

### Parallel Dispatch (all conditions must be met)
- Task is non-destructive OR agents touch completely independent files
- No dependencies between tasks (B does not need output from A)
- Clear ownership boundaries (different agents own different files)

**Upvest parallel patterns:**
- Data model work: data-engineer (staging) + data-analyst (Looker) when touching independent layers
- Cross-platform research: explore API code + explore dbt models + explore K8s manifests simultaneously
- Independent reviews: code-reviewer on service A + security-engineer on service B

### Sequential Dispatch (any condition triggers)
- Tasks have dependencies — output of A feeds into B
- Shared files or state — merge conflict risk
- Scope is unclear — need to understand before proceeding

**Upvest sequential chains:**
| Chain | Why Sequential |
|---|---|
| data-engineer → data-analytics-engineer → data-analyst | Schema must exist before models, models before dashboards |
| planner → specialist → code-reviewer | Plan before implement, implement before review |
| security-engineer → platform-engineer | DORA review before infrastructure apply |
| data-engineer → data-analytics-engineer | Staging model before mart model |

### Background Dispatch
- Research and analysis tasks (not file modifications)
- Results aren't blocking the current conversation
- Long-running exploration that would bloat the main context

**Upvest background patterns:**
- Codebase exploration (Explore agent)
- Datadog metric/log queries via MCP
- Linear ticket search and analysis via MCP
- BigQuery schema inspection

### Consolidation Strategy

When multiple subagents research in parallel, consolidate before acting:

1. **Dispatch** parallel non-destructive subagents (research, review, analysis)
2. **Collect** findings — each subagent writes to a file or returns a summary
3. **Consolidate** — main agent reads all findings and synthesizes
4. **Act** — main agent (or a single specialist) implements changes from the consolidated view

This prevents the main context from bloating with raw research output. For best results, clear or compact the context after consolidation and before implementation — the main agent starts execution with a clean slate and the consolidated findings.

**Upvest example**: Investigating a data quality issue across the stack:
- Subagent 1 (data-engineer): Check source freshness and staging model output
- Subagent 2 (data-analytics-engineer): Check mart model logic and Elementary tests
- Subagent 3 (data-analyst): Check Looker dashboard for visual anomalies
- Main agent reads all three reports → identifies root cause → implements fix

### Concurrency Limits & Resumable Agents

**Parallel cap**: ~10 concurrent subagents. If more are queued, Claude batches and executes subsequent groups after earlier ones complete. For Upvest's 17 agents, this is rarely a constraint — most workflows use 2-4 agents in parallel.

**Resumable subagents**: Each subagent execution returns a unique `agentId`. You can resume a subagent later with full context preserved — useful for multi-session research, long-running investigations, or revisiting a previous analysis without starting fresh.

```
# Resume a previous subagent
"Resume agent abc123 and continue the security audit of the payment module"
```

**When to resume vs start fresh:**
- Resume when: continuing a multi-step investigation, the subagent built up valuable context, you want to ask follow-up questions about its findings
- Start fresh when: the task is new, the previous context is stale, you want a clean perspective

### Invocation Quality

Most subagent failures are invocation failures — the main agent sends vague instructions. Every subagent dispatch must include:

1. **Specific scope** — what exactly to do, not "fix authentication"
2. **File references** — which files or paths to focus on
3. **Context** — relevant ticket IDs, error messages, or prior findings
4. **Success criteria** — what "done" looks like for this task

**Bad:** "Review the data pipeline"
**Good:** "Review `stg_history__order_execution_update` for NULL handling in the `price` column. DATA-529 reports incorrect aggregations in mart_trading. Check if the staging model passes through NULLs that should be filtered."

---

## Ownership Boundaries

### Hard Boundaries (never cross)
| Boundary | Owner | Others Must Not |
|---|---|---|
| `etl.*` schema, `stg_*` models, `sources.yml` | data-engineer | Write staging models |
| `int_*`, `mart_*` dbt models | data-analytics-engineer | Write mart models |
| Looker LookML views/explores | data-analyst | Modify LookML |
| Kafka topic provisioning (Crossplane CRs) | data-engineer | Create topics |
| `kubernetes/services/api/` manifests | product-engineer | Modify service K8s manifests |
| ArgoCD ApplicationSets, cluster registry | platform-engineer | Modify platform manifests |
| Cerbos policies, upfront-bff | upfront | Modify tenant access control |
| ops-four-eyes, ops-permissions | ops-tooling | Modify ops RBAC |
| ICT risk framework, regulatory compliance | security-engineer | Make compliance decisions |
| Agent definitions, `rules/*.md` | product-technical-writer | Modify agent ecosystem |
| FIFO P&L, `mart_risk` business logic | data-risk-manager | Modify risk calculations |

### Shared Boundaries (collaborate)
| Area | Primary | Secondary | Protocol |
|---|---|---|---|
| New Kafka topic end-to-end | data-engineer | platform-engineer | Data-engineer designs and adds staging → platform deploys |
| New product service end-to-end | product-engineer | platform-engineer + cicd-engineer | Product builds → platform deploys → CI/CD automates |
| Domain split (analytics-bigquery-writer) | data-engineer | platform-engineer | Data-engineer authors deploy.go → platform reviews K8s output |
| Security review of new service | security-engineer | product-engineer or platform-engineer | Security reviews → owner implements fixes |
| DORA compliance assessment | security-engineer | all affected agents | Security assesses → owners implement requirements |

### Linear Board: TAP-* (Tooling Apps)

`TAP-*` is **owned by `upvest-engineering-ops-tooling`** — they are responsible for the OpsPanel and all ops-domain services. TAP-* is exclusively for ops-tooling work (OpsPanel, ops-gateway, ops-bff, ops-four-eyes, ops-permissions, webhook infra, tooling-* services).

| Ticket Type | Owner |
|---|---|
| OpsPanel features, ops-gateway, ops-bff, ops-four-eyes, ops-permissions, webhook infra, tooling-* services | ops-tooling |
| ops-frontend (shared UI components) | ops-tooling |

### Linear Board: UPF-* (Upfront)

`UPF-*` is **owned by `upvest-engineering-upfront`** — they are responsible for the client-facing tenant portal (upfront-bff, upfront-cerbos, upfront-iam).

| Ticket Type | Owner |
|---|---|
| upfront-bff, upfront-cerbos, upfront-iam, tenant-facing access control | upfront |

### Linear Board: GT-* (Governance)

`GT-*` is **owned by the Governance team** (`eng-team-governance`) — a separate team from ops-tooling. Owns `treasury-service`, `treasury-mapper-service` (treasury operations), `ledger-balance-service`, `ledger-adjustments-service`, `reconciliation-service`, and `reconciliation-classifier` (ledger and reconciliation). Ops-tooling has no involvement with GT-* tickets.

---

## Escalation Paths

### Technical Escalation
```
Any agent encounters a problem outside their domain
  → Route to the owning agent (check Ownership Boundaries table)
  → If owning agent cannot resolve → escalate to planner for cross-domain plan
  → If cross-domain plan needed → planner coordinates with all affected agents
```

### Security/Compliance Escalation
```
Any agent encounters a security or regulatory concern
  → Immediately route to security-engineer
  → security-engineer assesses and classifies (DORA, PCI DSS, KYC/AML)
  → security-engineer coordinates remediation with owning agents
  → Findings tracked as SENG-* Linear tickets
```

### Incident Escalation
```
Any agent detects a production issue
  → Check Datadog MCP for metrics/logs (if available)
  → Route to owning agent for investigation
  → If major ICT incident (DORA definition) → notify security-engineer
  → If affects financial data integrity → notify data-risk-manager
  → If affects regulatory reporting → notify data-risk-manager + security-engineer
```

### Product Escalation
```
Any agent needs product decision
  → Investment API features → product-manager
  → Data platform features → technical-product-manager
  → Cross-domain features → both PMs coordinate
```

---

## Communication Protocols

### When to Call Another Agent
1. **The task crosses your ownership boundary** — always defer, never guess
2. **You need domain context you don't have** — ask the expert rather than assuming
3. **Security or compliance is involved** — always route to security-engineer
4. **The task requires planning across 3+ agents** — invoke planner

### When NOT to Call Another Agent
1. **The task is fully within your ownership** — just do it
2. **You're asking for general coding advice** — use rules/ files instead
3. **You're looking for a rubber stamp** — make the decision if it's in your domain

### Handoff Protocol
When routing work to another agent:
1. **State what you need** — specific ask, not vague context dump
2. **Provide relevant context** — file paths, ticket numbers, error messages
3. **State the urgency** — blocking (needs immediate response) vs. async (can wait)
4. **State what you've already tried** — avoid duplicate investigation

### Notification Protocol
When your work affects another agent's domain:
1. **Proactive notification** — tell the affected agent before they discover the change
2. **Include the impact** — what changed, what they need to do (if anything)
3. **Link the ticket** — provide the Linear ticket for tracking

---

## Human-in-the-Loop Checkpoints

Explicit human approval gates. Agents must STOP and wait for human approval at these points.

| Checkpoint | When | What Human Reviews |
|---|---|---|
| Plan approval | After planner produces PLAN.md | Approach, scope, affected systems |
| ADR approval | After security-engineer writes ADR | Design decisions, migration risks, DORA compliance |
| Pre-implementation | After specialist agent completes code | Code quality, test coverage, PII handling |
| Pre-PR | Before creating pull request | Summary of changes, Linear ticket linkage |
| Pre-apply | Before Terraform/K8s changes reach sandbox/live | Infrastructure impact, rollback plan |

### Ask-First Rules

These agents have mandatory pause points baked into their workflow:

| Agent | Pause Rule |
|---|---|
| planner | If the task spans 3+ agents, present the plan and WAIT for approval before proceeding |
| security-engineer | If a public API change or new third-party provider is involved, STOP and request approval before finalizing |
| data-analytics-engineer | If a mart schema change could break Looker dashboards, STOP and confirm with data-analyst before proceeding |
| platform-engineer | If the change affects sandbox/live clusters, STOP and request apply approval before proceeding |

See `rules/pipeline-workflows.md` for full workflow templates and per-agent Definition of Done.

---

## Agent-First Engineering Workflows

*Patterns adapted from OpenAI's harness engineering approach.*

### Planning with PLAN.md
For non-trivial tasks, agents should write a `PLAN.md` file committed to the codebase before implementation:
- Captures the approach, affected files, dependencies, and risks
- Human reviews and approves the plan before agent proceeds
- Serves as an audit trail and context for code reviewers

### MCP-Connected Operational Triage
Agents with Datadog MCP and Linear MCP should use them as feedback loops:
1. **Incident detected** → query Datadog for metrics/logs → identify root cause → create Linear ticket
2. **Ticket investigation** → read Linear ticket → query Datadog for relevant traces → propose fix
3. **Post-deployment** → check Datadog monitors → verify no regression → update Linear ticket

### Agent-Generated Release Summaries
When preparing releases, agents should review commits and summarize key changes:
- Technical writer agent drafts release notes from commit history
- Code reviewer agent validates that PR descriptions match actual changes
- Planner agent flags any incomplete items from the implementation plan

### Review Quality Feedback
Use PR comment reactions as a lightweight signal for review quality:
- 👍 on useful review comments, 👎 on noise — tracked over time
- Patterns of low-signal reviews indicate the reviewer agent needs better context or constraints

### Simulated Incident Testing
Periodically test that agents can handle incident scenarios:
- Can the platform-engineer agent diagnose a pod crash from Datadog logs?
- Can the data-engineer agent identify a stale source from BigQuery freshness queries?
- Can the security-engineer agent classify an ICT incident per DORA requirements?

---

## When to Use Subagents vs Main Conversation

### Use a subagent when
- The task produces verbose output you don't need in main context (log analysis, codebase exploration, test runs)
- You need context isolation — long research shouldn't consume the main conversation's window
- Running multiple independent tasks in parallel (e.g., research API + explore tests + check docs simultaneously)
- The task requires specialized tool restrictions (e.g., read-only for reviewers)
- You want independent verification of completed work

### Use the main conversation when
- The task needs frequent back-and-forth or iterative refinement
- Multiple phases share significant context (planning → implementation → testing in one flow)
- You're making a quick, targeted change
- Latency matters — subagents start fresh and need time to gather context

### Subagents as Context Collectors (not Implementers)

**The main agent should do implementation. Subagents should research, analyze, and report back.**

Subagents work best when they collect information and return a condensed summary — not when they try to implement entire features. Each subagent only knows about its own task and has no context about the full project. When a bug needs fixing across files, a subagent implementing code is "blind" to what happened elsewhere.

**The pattern: Explore → Plan → Execute**
1. **Explore**: Subagents read docs, logs, and codebase — then summarize key findings
2. **Plan**: Main agent (or planner subagent) receives reports, develops implementation plan
3. **Execute**: Main agent implements. Subagents validate after completion (code-reviewer, tester)

**Which Upvest agents are context collectors (read + report)?**
- planner — researches, writes PLAN.md, returns approach
- code-reviewer — reads code, returns findings
- product-technical-writer — reads code, designs prompts, writes documentation
- data-analyst — reads data, returns analysis

**Which Upvest agents implement (write code)?**
- go-developer, python-developer — write code when invoked by main agent
- data-engineer, data-analytics-engineer — write dbt models
- platform-engineer — write K8s/Terraform manifests

**Important**: When implementation agents run as subagents, they lose visibility into the broader conversation. Prefer running implementation in the main conversation and delegating research/verification to subagents.

### Context Quarantine & Protection

**Context quarantine** is the practice of isolating verbose, intermediate work inside subagents so the main agent's context stays clean and focused. The main agent receives only the final summary — not the dozens of tool calls, file reads, and log lines that produced it.

**Protect the main context:**

- **Subagents isolate verbose output** — file reads, log analysis, and exploration stay in the subagent's window. Only the summary returns to the main agent.
- **Use the file system as memory** — write plans, reports, and findings to markdown files (`PLAN.md`, `rules/*.md`). Other agents read the file when needed instead of passing content through the context window.
- **Save raw data to files, return only summaries** — when a subagent gathers large amounts of data (BigQuery results, Datadog logs, codebase analysis), write raw output to a file and return only the analysis summary to the parent.
- **Minimize distractors** — irrelevant context degrades performance more than missing context. Be selective about what enters the main conversation.
- **Compact early** — if context is filling up, compact before quality degrades, not after.

**Context rot** — LLM performance degrades as input length increases, even for simple tasks. Key findings:
- Even a single irrelevant piece of context reduces accuracy
- Structured text can paradoxically make retrieval harder — models follow the flow instead of finding the needle
- The solution is not more context — it's better-selected, minimal context

### Concise Return Convention

All Upvest subagents should return concise results to the parent. Include this guidance in agent system prompts:

- **Summaries over raw data** — return key findings as bullet points, not full query results
- **Structured format** — use consistent output structure (findings, confidence, next steps)
- **Word budget** — aim for <500 words in return messages unless the parent explicitly requests detail
- **No intermediate output** — don't include tool call logs, search results, or verbose stack traces in the return message
- **File references over inline content** — if results are large, write to a file and return the path

### Cost & Token Considerations
- Each subagent has its own context window — running 5 in parallel uses ~5x the tokens
- Subagents isolate noisy intermediate output — the parent only sees the final summary
- Use `model: haiku` for exploration-heavy agents to reduce cost (all Upvest agents default to haiku)
- For simple single-purpose tasks, the main conversation is faster than spawning a subagent

---

## Verification Pattern

After a specialist agent claims work is complete, use `upvest-product-code-reviewer` as an independent verifier:

1. Specialist agent implements the change and claims "done"
2. Code reviewer subagent is invoked to verify: does the code compile? Do tests pass? Are there PII exposures?
3. If verification fails, findings route back to the specialist for fixes
4. Only after verification passes does the human review for PR approval

This prevents the common pattern where an agent marks work complete but the implementation is partial or broken.

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Silent boundary crossing | Creates confusion, breaks ownership | Always route to the owner |
| Escalation skipping | Misses context, creates rework | Follow the escalation path |
| Shotgun notification | Noise drowns signal | Notify only affected agents |
| Heroic single-agent resolution | Misses domain knowledge, creates risk | Collaborate with the expert |
| Circular routing | Agent A → B → C → A | Identify the owner, route directly |
| Assuming context | Other agent may not know your situation | Always provide context in handoffs |
| Too many subagents | 17 specialists is the right number — don't add more without a clear distinct use case | Merge into existing agent or add to rules/ |
| Vague descriptions | "Helps with coding" gives no routing signal | Be specific: "Use when implementing Kafka consumers with franz-go" |
| Subagent for simple tasks | Spawning a subagent for a one-line fix wastes tokens and adds latency | Do it in the main conversation |
| Overly long prompts | 1000+ line agent definitions dilute focus | Extract shared content to rules/, keep agent body focused |
