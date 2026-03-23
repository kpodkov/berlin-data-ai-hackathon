# Fintech Regulatory Compliance Reference

> Upvest-specific regulatory patterns for PCI DSS, KYC/AML, SOX, PSD2, and financial API security.
> For DORA-specific requirements, see `rules/dora-compliance.md`.

This file contains reference patterns and compliance checklists for fintech regulatory requirements. The `upvest-engineering-security-engineer` is the authoritative agent for all regulatory compliance questions.

---

## PCI DSS — Payment Card Industry Data Security Standard

### Core Principles
1. **Never store sensitive authentication data** after authorisation (CVV, full track data, PIN)
2. **Tokenize** cardholder data — replace PAN with irreversible tokens for internal use
3. **Encrypt** cardholder data at rest (AES-256-GCM) and in transit (TLS 1.3)
4. **Mask** PAN when displayed — show only last four digits
5. **Restrict access** to cardholder data on a need-to-know basis
6. **Audit log** all access to cardholder data — logs must be tamper-evident

### Secure Payment Processing Pattern

```typescript
// Reference pattern — PCI DSS compliant payment handling
// Key principles demonstrated:

// 1. Tokenization: Replace card number with HMAC-SHA256 token
const token = crypto.createHmac('sha256', encryptionKey).update(cardNumber).digest('hex');

// 2. Minimal retention: Only store token + last four digits
const tokenizedData = { token, lastFour: cardNumber.slice(-4), amount, currency };

// 3. Luhn validation: Verify card number format before processing
// 4. Encrypted transmission: AES-256-GCM with random IV + auth tag
// 5. Secure error handling: Never expose internal details in error responses
// 6. Rate limiting: Per-IP + per-user combination
// 7. Fraud scoring: IP risk + amount risk + velocity checks + device fingerprinting
```

### PCI DSS Compliance Checklist
- [ ] No sensitive auth data stored post-authorisation
- [ ] PAN tokenized or encrypted at rest
- [ ] TLS 1.3 for all cardholder data transmission
- [ ] PAN masked in all display contexts (last four only)
- [ ] Access logging for all cardholder data access
- [ ] Encryption keys stored in HSM or secure key management (Cloud KMS)
- [ ] Regular vulnerability scans on payment-processing systems
- [ ] Incident response plan for payment data breaches

---

## KYC/AML — Know Your Customer / Anti-Money Laundering

### KYC Verification Steps
1. **Identity verification** — document number validation, age check, name format validation
2. **Sanctions screening** — check against OFAC, EU, UN sanctions lists (exact + fuzzy matching)
3. **PEP screening** — Politically Exposed Person database check
4. **Geographic risk assessment** — high-risk jurisdiction flagging (nationality + address)
5. **Risk scoring** — weighted composite score determining approve/review/reject

### Risk Classification

| Score Range | Risk Level | Action |
|---|---|---|
| < 0.3 | Low | Auto-approve |
| 0.3 - 0.7 | Medium | Manual review required |
| > 0.7 | High | Auto-reject, flag for investigation |

### Risk Factor Weights
- Identity verification issues: severity-based (invalid doc = high, suspicious name = medium)
- Sanctions match: exact = high, fuzzy (>80% similarity) = medium
- PEP match: high severity
- Geographic risk: high-risk nationality = high, high-risk address = medium

### KYC/AML Compliance Checklist
- [ ] Customer identity verified against government-issued documents
- [ ] Sanctions screening against all applicable lists (OFAC, EU, UN)
- [ ] Fuzzy name matching implemented (Levenshtein distance > 80% threshold)
- [ ] PEP screening performed
- [ ] Geographic risk assessed for nationality AND address
- [ ] Risk score calculated and action determined
- [ ] Full audit trail logged (no sensitive personal data in logs)
- [ ] Ongoing monitoring for existing customers (periodic re-screening)

---

## Financial API Security

### Authentication & Authorisation
- **OAuth 2.0 / OpenID Connect** for all financial API authentication
- JWT tokens with: `sub` (user ID), `aud` (audience validation), `iss` (issuer), `scope` (permissions), `exp` (expiration)
- Valid audiences must be explicitly whitelisted (e.g., `mobile-app`, `web-app`, `partner-api`)
- Scope-based access control: endpoints require specific scopes (e.g., `read:accounts`, `write:transfers`)

### Transaction Authorisation
- **Transaction limits** based on user permission scopes:
  - Standard: 10,000 per transaction, 100,000 daily
  - Medium: 100,000 per transaction, 1,000,000 daily
  - High-value: 1,000,000 per transaction, 10,000,000 daily
- Daily and monthly cumulative limit checks
- Amount + currency validation on every transaction

### Rate Limiting
- Per-endpoint rate limits based on sensitivity:
  - Read endpoints: 100 requests/minute
  - Write/transfer endpoints: 10 requests/5 minutes
- Key generation: IP + user ID combination
- Standard headers (`RateLimit-*`), no legacy headers

### Security Headers (mandatory for all financial APIs)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```

### Audit Logging
- Log every API request: method, URL, user agent, IP, user ID, timestamp, status code, duration
- **Never log** request/response bodies for financial APIs
- Send to secure, tamper-evident audit system
- Retain per regulatory requirements

### Input Validation
- Strict JSON schema validation on all inputs
- Amount: must be positive number with defined minimum (e.g., 0.01)
- Currency: enum of supported currencies
- Account numbers: regex pattern validation (e.g., `^[0-9]{10,20}$`)
- Sanitize all input after validation

---

## Fraud Detection Patterns

### Multi-Factor Fraud Scoring
| Factor | Weight | Signals |
|---|---|---|
| IP risk | 30% | Threat intelligence feeds, proxy/VPN detection, geolocation anomaly |
| Amount risk | 20-50% | Threshold-based (>10k = +0.2, >50k = +0.3) |
| Transaction velocity | 20% | Unusual spikes in activity per merchant/user |
| Device fingerprinting | 30% | User-Agent anomalies, suspicious patterns |

### Fraud Score Thresholds
- Score > 0.8: **Decline** transaction, log suspicious activity
- Score 0.5-0.8: **Flag** for manual review
- Score < 0.5: **Process** normally

### Secure Fraud Logging
- Log: IP, user agent, amount, fraud score, timestamp
- **Never log**: card numbers, CVV, account credentials, full PII

---

## SOX — Sarbanes-Oxley Act

### Relevance to Upvest
- Financial reporting integrity controls
- Internal controls over financial data processing
- Audit trail requirements for financial transactions
- Segregation of duties in financial systems

### Key Requirements
- All financial data modifications must be auditable
- Access to financial reporting systems requires explicit authorisation
- Changes to financial calculation logic require documented approval
- Backup and recovery of financial data must be tested regularly

---

## PSD2 / Open Banking

### Strong Customer Authentication (SCA)
- Two of three factors required: knowledge (PIN), possession (device), inherence (biometric)
- Applies to: electronic payment initiation, remote access to payment accounts
- Dynamic linking: authentication code tied to specific amount and payee

### API Security for Open Banking
- Qualified certificates for API authentication
- Consent management: explicit customer consent for data sharing
- Rate limiting and throttling per third-party provider
- Transaction risk analysis may exempt low-risk transactions from SCA

---

## Cross-Cutting: Secure Error Handling for Financial Services

### Principles
1. **Never expose internal details** in error responses — use generic messages
2. **Log detailed errors internally** — without sensitive financial data
3. **Use standard error codes**: `unauthorized`, `insufficient_scope`, `rate_limit_exceeded`, `invalid_request`
4. **Include retry guidance** where appropriate (e.g., `retry_after` for rate limits)
5. **Separate client-facing errors from internal errors** — clients get HTTP status + generic message

### Error Response Pattern
```json
{
  "error": "payment_processing_failed",
  "error_description": "Transaction could not be completed"
}
```
Never include: stack traces, internal IDs, database errors, service names, infrastructure details.

---

## Cloud Outsourcing Risk Patterns for Financial Institutions

**Source: Bundesbank/BaFin guidance + Bundesbank July 2021 report**

### Key Risks
- **Vendor lock-in**: Legal, organisational, or technical dependency on a single provider making migration difficult. Analyse alternatives before contracting.
- **Concentration risk**: A small number of large providers dominate the market (~60% market share for top 3). If a major provider fails, it could be systemic.
- **Audit complexity**: Size and complexity of large cloud providers makes individual institution audits impractical. Use **pooled audits** where possible.
- **Sub-outsourcing chains**: Cloud providers' subcontracting can create long, opaque chains. Monitor and ensure contractual visibility.
- **Negotiating power asymmetry**: Large cloud providers face many similar requirements from financial sector — institutions have limited individual leverage.

### Requirements (now formalised under DORA)
- Impact of cloud computing must be considered from **strategy level** (not just technical decisions)
- IT landscape must be standardised before migration
- Contract monitoring, risk management, and internal audit must keep pace with outsourcing scale
- Transparency requirements for security incidents at providers
- Full outsourcing register maintained and reported to supervisors

### Upvest-Specific Application
- **GCP**: Primary cloud provider — assess vendor lock-in risk, maintain exit strategy capability
- **Confluent Cloud**: Kafka-as-a-service — DORA ICT third-party contractual clauses required (see `rules/dora-compliance.md` section 6)
- Any new cloud service adoption requires DORA due diligence before contracting

---

## When to Consult This Reference

- Building or modifying payment processing flows
- Implementing user onboarding / KYC flows
- Designing financial API endpoints
- Adding transaction processing logic
- Reviewing fraud detection systems
- Assessing regulatory compliance of existing systems
- Onboarding new financial data third-party providers

For all regulatory compliance questions, consult `upvest-engineering-security-engineer`.
