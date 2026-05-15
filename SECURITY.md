🔐 FaxNova Security Policy

Last updated: May 2026

---

📬 Reporting a Vulnerability
If you discover a security issue in FaxNova, please report it responsibly.

Security Contact: security@faxnova.app  
We will acknowledge your report within 48 hours and provide updates until the issue is resolved.

Responsible Disclosure Guidelines
We ask researchers to:
- Avoid accessing customer data  
- Avoid service disruption  
- Provide a clear proof‑of‑concept  
- Allow reasonable time for remediation before public disclosure  

---

🧩 Supported Versions
Security updates apply to the following branches:

| Version | Status |
|--------|--------|
| main | Actively supported |
| dev | Development only (not for production) |

Older branches are not maintained.

---

🔑 Authentication & API Security
FaxNova uses OAuth 2.0 exclusively for all Sinch API interactions.

- Access tokens are refreshed automatically before expiration or upon receiving a 401  
- No Basic Auth is used in production  
- All API calls include correlation IDs for traceability  

---

🔐 Credential & Secret Management
- All secrets (Sinch Key ID, Secret, DB credentials) are stored in environment variables only  
- Secrets must never be committed to the repository  
- Credentials are rotated regularly and immediately upon suspected compromise  
- Secrets must not appear in logs, error messages, or analytics  

---

🌐 Webhook Security
FaxNova implements multiple layers of webhook protection:

- HMAC‑SHA256 signature verification using a shared secret  
- Timestamp validation to prevent replay attacks  
- Idempotency checks to avoid duplicate processing  
- Strict JSON schema validation for incoming webhook payloads  
- Rate limiting on webhook endpoints  
- Optional: IP allowlisting if the provider publishes stable ranges  

---

📁 File Handling & Attachment Safety
FaxNova enforces strict file validation:

- Only PDF and TIFF files are accepted  
- File URLs must be HTTPS and temporary  
- File size limits are enforced  
- Inbound attachments (if enabled) must be securely stored and deleted after processing  
- No file content is ever executed or rendered server‑side  

---

📞 Input Validation
All user‑provided and webhook‑provided data is validated:

- Phone numbers must be in E.164 format  
- Fax metadata is sanitized and schema‑validated  
- Empty or malformed to arrays are rejected  
- Invalid fax IDs or correlation IDs return structured errors  

---

🧱 API Hardening
- All public endpoints are rate‑limited  
- Request body size limits are enforced  
- X‑Powered‑By header is disabled  
- HTTPS is required for all communication  
- CORS is restricted to approved origins  

---

📊 Logging & Observability
FaxNova uses structured JSON logging with:

- Correlation ID propagation  
- No sensitive data in logs  
- Webhook event persistence for auditability  
- Error categorization for monitoring and alerting  

Logs are rotated and retained according to operational policy.

---

🗄️ Database Security
- All queries use parameterized statements  
- Database credentials use least‑privilege access  
- Data is encrypted at rest and in transit  
- Regular backups are performed and tested  

---

🔍 Dependency & Supply Chain Security
- Dependencies are scanned weekly using automated tools  
- High‑severity vulnerabilities are patched within 72 hours  
- Deprecated or unmaintained libraries are not used in production  
- Build artifacts are reproducible and verified  

---

🏗️ Infrastructure Security
- Production systems run in isolated VPC networks  
- Access requires MFA and least‑privilege IAM roles  
- All traffic is encrypted in transit (TLS 1.2+)  
- Deployment pipelines enforce integrity and access controls  

---

🧪 Testing & Monitoring
- Webhook flows include integration tests  
- Monitoring is in place for failed faxes and webhook errors  
- Alerts are triggered for repeated failures or abnormal patterns  
- Health checks are enabled for all backend services  

---

🧭 Operational Security
- Environment‑specific secrets for dev/staging/prod  
- Debug mode disabled in production  
- Regular dependency updates and vulnerability scans  
- Incident response procedures documented internally  
