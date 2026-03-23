---
name: dora-check
description: DORA compliance assessment for a PR, feature, or system change. Checks applicable DORA articles and flags gaps.
argument-hint: [description-of-change]
context: fork
agent: general-purpose
---

Assess DORA compliance for: $ARGUMENTS

## Assessment Framework

### Step 1: Identify Applicable Articles
Based on the change, determine which DORA articles apply:

| Change Type | Applicable Articles |
|---|---|
| Any ICT system change | Art. 9(4)(e) — change management (ALL changes, no materiality threshold) |
| New third-party service | Art. 28-30 — ICT third-party risk, contractual clauses |
| Touches PII | Art. 8(1) — ICT asset classification |
| Legacy system connection | Art. 8(7) — annual risk assessment required |
| Infrastructure change | Art. 7 — operational stability, Art. 12 — backup/recovery |
| Security-related | Art. 9 — operational info security, Art. 23-26 — IAM |

### Step 2: Compliance Checklist
For each applicable article, verify:
- [ ] Change documented and approved
- [ ] Testing performed (Art. 16(3) — static and dynamic testing for internet-exposed systems)
- [ ] Rollback plan exists
- [ ] ICT asset inventory updated if new system
- [ ] Third-party contractual clauses in place if new vendor
- [ ] PII classification consistent (Protobuf → dbt meta → BigQuery labels)
- [ ] Encryption standards met (at rest, in transit, in use)
- [ ] Access control follows need-to-use principle

### Step 3: Report
```
## DORA Compliance Assessment

Change: $ARGUMENTS

| Article | Applicable | Status | Action Required |
|---------|-----------|--------|-----------------|
| Art. 9(4)(e) Change Mgmt | ✅ | ✅/❌ | ... |
| Art. 28-30 Third-Party | ✅/❌ | ... | ... |
| Art. 8(1) Asset Class | ✅/❌ | ... | ... |
| ... | | | |

Overall: COMPLIANT / GAPS FOUND
Escalate to: upvest-engineering-security-engineer (if gaps)
```

## Reference
- See `rules/dora-compliance.md` for full DORA reference
- See `rules/fintech-regulatory.md` for PCI DSS, KYC/AML
