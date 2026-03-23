# DORA Compliance Reference

> **Regulation (EU) 2022/2554** — Digital Operational Resilience Act
> Applied from **17 January 2025**. All Upvest financial entities must comply.
> Based on BaFin supervisory guidance (June 2024).

This file is the shared DORA reference for all Upvest agents. Each agent should apply the sections relevant to their domain. Agent-specific DORA obligations are called out inline in each agent's definition file.

---

## Agent-Role Mapping

| DORA Pillar | Primary Owner | Supporting Agents |
|---|---|---|
| 1. Governance & ICT risk framework | security-engineer | planner, product-manager, technical-product-manager |
| 2. ICT risk & information security mgmt | security-engineer | all engineering agents |
| 3. IT operations (stability, change mgmt) | platform-engineer, cicd-engineer | data-engineer, ops-tooling |
| 4. ICT business continuity | platform-engineer, security-engineer | data-engineer |
| 5. Secure development & testing | code-reviewer, cicd-engineer | go-developer, python-developer |
| 6. ICT third-party risk management | security-engineer | data-engineer (Confluent), product-manager |
| 7. Operational info security | security-engineer | platform-engineer, upfront |
| 8. Identity & access management | security-engineer, upfront | ops-tooling |

---

## 1. Governance & Organisation

**Art. 5-6 DORA, Art. 2(2) RTS RMF**

### Digital Operational Resilience (DOR) Strategy
- Upvest must maintain a DOR strategy covering ICT risk management including third-party risk
- Strategy must define clear, verifiable information security objectives
- Must include an ICT reference architecture with planned changes for business objectives
- Must be reviewed and updated at least annually

### Management Body Responsibilities (Art. 5(2))
- Define, approve, oversee, and assume responsibility for the ICT risk management framework
- Approve ICT security policies (Art. 2(2)(b) RTS RMF)
- Ensure appropriate resources and ICT skills for all staff (Art. 5(2)(g))
- Members must maintain sufficient ICT risk knowledge and actively keep skills current (Art. 5(4))
- Periodically approve and review ICT business continuity policy and response/recovery plans
- Review internal ICT audit plans

### ICT Risk Control Function (Art. 6(4))
- Independent function responsible for managing and overseeing ICT risk
- Must follow three lines of defence model
- Separate from but related to the information security officer role
- Reports to management body at least annually on incidents, tests, and recommendations (Art. 13(5))

### ICT Risk Management Framework Review (Art. 6(5))
- **At least annually** or event-driven (after major incidents or test findings)
- Supervisory authority may request a report on the review
- Must continuously improve the framework based on findings

---

## 2. ICT Risk & Information Security Management

**Art. 3, 5, 6, 8, 13, 14, 45, 49 DORA; Art. 3-5, 27 RTS RMF**

### ICT Asset Classification (Art. 8(1), Art. 4-5 RTS RMF)
- Identify and classify all ICT-based business functions, information assets, and ICT assets
- Document in inventories resembling a CMDB (configuration management database)
- Map connections and interdependencies between assets
- Identify critical assets and dependencies on ICT third-party providers
- Identify risks from cyber threats and ICT vulnerabilities

### Legacy System Assessment (Art. 8(7))
- **All legacy ICT systems must be assessed at least annually**
- Assessment required before AND after connecting new technologies, applications, or systems
- Must evaluate the specific ICT risk level of each legacy system

### Analytical & Reporting Obligations
- Post-incident root cause analysis for major disruptions (Art. 13(2)) — including forensics, escalation, communication
- Annual reporting to management body on incidents and test findings (Art. 13(5))
- Monitor new technological developments and cyber-attack methods (Art. 13(7), Art. 3(1)(e) RTS RMF)

### Training & Communication (Art. 13(6), Art. 5(4), Art. 14)
- ICT security awareness programmes for **all employees and senior management**
- Management body members: specific ICT risk training
- Communication strategies for major ICT incidents and vulnerabilities
- Designated person for public/media communication on ICT incidents (Art. 14(3))
- Voluntary participation in cyber threat information-sharing communities (Art. 45(1))

---

## 3. IT Operations

**Art. 7, 8, 9, 12 DORA; Art. 4, 5, 8, 9, 17 RTS RMF**

### Operational Stability (Art. 7)
- ICT systems must be **updated, reliable, and technologically resilient**
- Must ensure adequate information processing even during **stressed market phases**
- Capacity management: monitor resources, prevent shortages before they occur (Art. 9 RTS RMF)
- Redundant ICT capacities with adequate resources, capabilities, and functions (Art. 12(4))

### Change Management (Art. 9(4)(e), Art. 17 RTS RMF)
- **ALL changes to ICT systems** must be recorded, tested, assessed, approved, implemented, and verified
- **No materiality threshold** — this applies to every change, not just significant ones
- Minimum requirements: check procedures, testing, impact analyses, fallback solutions
- Quality assurance documentation required

### Data Backup & Recovery (Art. 12)
- Backup and restoration policy with defined procedures and methods
- Backup systems must be **physically and logically segregated** from source systems
- After recovery: **multiple checks and reconciliations** to ensure data integrity (Art. 12(7))
- Security of network/information systems must not be endangered during backup/restore
- Regular testing of backup and restoration procedures

### Error Reporting
- Unscheduled deviations from standard operations ("errors") must be assessed via appropriate procedures
- ICT incident classification and reporting per Chapter III of DORA (Art. 17-23)

---

## 4. ICT Business Continuity Management

**Art. 11-12 DORA; Art. 10-15 RTS RMF**

### Policy & Plans (Art. 11, Art. 10-12 RTS RMF)
- ICT business continuity policy approved by management body
- ICT response and recovery plans for all critical functions
- Plans must cover: activation criteria, roles, communication protocols, recovery time objectives
- Must account for scenarios including: cyber-attacks, ICT failures, natural disasters, pandemics

### Mandatory Scenarios (expanded vs BAIT/VAIT)
- Switchover between primary and backup infrastructure
- Loss of critical ICT third-party provider services
- Severe cyber-attacks on internet-facing systems
- Physical disruption to data centres or critical infrastructure

### Regular Review (Art. 11(6), Art. 13 RTS RMF)
- BCM plans tested at least annually
- Tests must cover all critical functions and dependencies
- Results reported to management body
- Plans updated based on test findings and incidents

### Crisis Management & Communication (Art. 11(7), Art. 14)
- Dedicated crisis management procedures
- Internal and external communication plans
- Coordination with relevant authorities

---

## 5. ICT Project Management & Secure Development

**Art. 8, 16 RTS RMF; Art. 9(4)(e) DORA**

### Secure Development (Art. 16 RTS RMF)
- Acquisition, development, and maintenance policy with concrete minimum elements
- Focus on **secure implementation** and requirement identification
- Security testing required within source code review for **internet-exposed systems** (Art. 16(3))
- **Static and dynamic testing** of source code before production use
- Applies to third-party source code AND proprietary/compiled code (Art. 16(8))

### Testing Requirements (Art. 16(2) RTS RMF)
- Effective testing procedures including quality assurance
- Testing of all changes with documented results
- Source code anomaly detection via SAST and DAST

### Change Management in Development (Art. 17 RTS RMF)
- Effective testing procedures for all changes
- Quality assurance (Art. 17(1)(c)(ii))
- Impact analysis and fallback/rollback solutions
- No materiality threshold — all changes in scope

---

## 6. ICT Third-Party Risk Management

**Art. 28-30 DORA; RTS TPPol; draft RTS SUB**

### Scope & Distinction (Art. 28)
- DORA applies to **all ICT services** from third-party providers, not just outsourced functions
- Broader than traditional outsourcing regulation
- Financial entity retains **full responsibility** regardless of third-party arrangements

### Contractual Requirements (Art. 30, Annex)
All ICT third-party contracts must include:
- Clear description of all functions and ICT services
- Service level descriptions with quantitative and qualitative targets
- Data processing/storage locations and change notification
- Availability, authenticity, integrity, confidentiality provisions
- Data access, recovery, and return provisions (including insolvency scenarios)
- ICT incident assistance obligations
- Cooperation with competent authorities
- Termination rights and minimum notice periods
- ICT security awareness training participation

**For critical/important functions (additional):**
- Full SLA descriptions with precise quantitative targets
- Unrestricted audit, inspection, and access rights
- TLPT participation and cooperation
- Ongoing performance monitoring rights
- Exit strategies with mandatory transition periods
- Business contingency plan requirements

### Subcontracting (draft RTS SUB)
- Financial entity must know and approve subcontracting of critical/important functions
- Relevant contract clauses must be replicated in subcontracts
- Monitoring and reporting obligations for subcontractors
- Termination rights if subcontracting changes without consent
- Location and data processing transparency

### Exit Strategy (Art. 28(8))
- Mandatory exit plans for all critical/important ICT third-party services
- Adequate transition period for migration
- Plans must be tested and updated regularly

### Information Register (Art. 28(3))
- Register of all ICT third-party arrangements
- Distinguish between critical/important and other services
- Report to supervisory authority on request

### Due Diligence
- Risk analysis before entering ICT third-party arrangements
- Assess concentration risk, vendor lock-in, compliance capability
- Ongoing monitoring of provider's risk posture

---

## 7. Operational Information Security

**Art. 9 DORA; Art. 18-22 RTS RMF**

### Network Security (Art. 9(2), Art. 18-19 RTS RMF)
- Stronger requirements than BAIT/VAIT
- Network segmentation, monitoring, and protection
- Secure configuration of network components

### Encryption (Art. 9(4)(d), Art. 20-21 RTS RMF)
- Data must be encrypted **at rest, in transit, AND in use**
- "In use" encryption is a new DORA requirement beyond BAIT/VAIT
- Cryptographic key management policies required
- Regular review of encryption standards

### Vulnerability Management (Art. 9(4)(c), Art. 22 RTS RMF)
- Timely identification, assessment, and remediation of vulnerabilities
- Patch management with defined timelines
- Vulnerability scanning and penetration testing
- Prioritisation based on risk and exploitability

---

## 8. Identity & Access Management

**Art. 9(4)(c) DORA; Art. 23-26 RTS RMF**

### Identity Management (Art. 23 RTS RMF)
- Explicit lifecycle management: create, modify, temporarily disable, delete
- Unique identification of all persons and systems accessing ICT assets
- Regular review of access rights

### "Need-to-Use" Principle (Art. 24-25 RTS RMF)
- New concept beyond traditional "need-to-know"
- Access restricted to what is **functionally necessary** for the specific role
- Applies to both human and system/service accounts
- Privileged access must be time-limited and monitored
- Regular recertification of access rights

### Authentication (Art. 26 RTS RMF)
- Strong authentication for access to critical systems
- Multi-factor authentication where appropriate
- Session management and timeout policies

---

## 9. Bundesbank Inspection Priorities & TIBER-DE

**Source: Bundesbank Monthly Report, July 2021 — "Digital risks in the banking sector"**

### Top Inspection Deficiency Areas (10-year data from 2,000+ inspections)

Material deficiencies found in ~50% of all inspections. Of IT-related findings:

| Area | Share | Priority for Upvest |
|---|---|---|
| Outsourcing & external IT procurement | 21% | High — Confluent Cloud, GCP, all third-party ICT |
| Information risk management | 17% | High — ICT asset inventories, risk assessments |
| Information security management | 16% | High — security measures, testing, ISO independence |
| Identity & access management | 13% | High — access rights reviews, segregation |
| IT projects & application development | 13% | Medium — testing, documentation, secure development |
| Business continuity management | 9% | Medium — BCM plan testing, scenario coverage |
| IT operations | 5% | Lower — but critical for uptime |
| IT strategy | 3% | Lower |
| IT governance | 3% | Lower |

**Key takeaway**: Outsourcing management, information risk management, and information security management account for **54%** of all material deficiencies. These are the areas where DORA has introduced the strongest new requirements.

### Common Outsourcing Deficiencies (from inspections)
- Services not classified as outsourcing when they should be
- Risk analyses for determining outsourcing materiality exhibit basic failings
- Missing information and audit rights in outsourcing contracts
- Insufficient requirements for sub-outsourcing
- Difficulty monitoring long or complex outsourcing chains

### TIBER-DE — Threat Intelligence-Based Ethical Red Teaming

DORA formalises threat-led penetration testing (TLPT) in Art. 26-27. TIBER-DE is the German implementation:

- Ethical hackers simulate realistic attacks on critical functions and **live systems**
- Targets: payment systems, core banking, online banking — **not just test environments**
- Covers: technical vulnerabilities, organisational shortcomings, AND human factor
- Tests interplay between processes, employees, and systems
- Management body involved from the outset
- Not a pass/fail test — success = conducted per framework
- Key finding: **human error or lack of security guidelines can render sophisticated technical measures ineffective**
- Key finding: **attentive, informed employees with well-defined security protocols can detect and ward off even sophisticated attacks early**

### AI/ML in Banking — Supervisory Expectations

When Upvest uses machine learning in risk-relevant systems:

- **Explainability**: ML "black box" methods require clear accountability for decisions. Explainable AI (XAI) approaches are promising but do not offer complete explainability.
- **Model development & validation**: High data requirements increase importance of data quality. ML methods must be integrated into suitable control environments with clear accountability.
- **Training cycles**: Retraining must be justified. Model validation must cover ongoing retraining scenarios. Balance between adapting to reality and maintaining continuity/comparability.
- **Technology-neutral approach**: Supervisors apply the same principles regardless of whether ML is developed in-house or outsourced. On-site inspections extend to external service providers.

---

## Quick Reference: When to Escalate to Security Engineer

Any agent should escalate to `upvest-engineering-security-engineer` when:
- A change touches ICT third-party arrangements (new vendor, contract change, subcontracting)
- A major ICT incident occurs that may require regulatory reporting
- Legacy systems are being connected to new technologies (triggers Art. 8(7) assessment)
- A new service handles PII, payment data, or regulatory data
- Encryption, authentication, or access control patterns need review
- DORA compliance of a design or architecture is uncertain
- Annual ICT risk framework review is due
