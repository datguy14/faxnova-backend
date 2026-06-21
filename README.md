Environment validation

Structured audit logging

See the security model.

5. Automated Code Audits (CI)

Every push and pull request triggers:

Static analysis

Code quality checks

Security checks

Auto‑fix suggestions

PR comments

Merge blocking on critical issues

This dramatically increases acquisition readiness and reduces long‑term maintenance risk.

📂 Project Structure

src/
  agents/          # AI agent handlers
  audit/           # Audit Agent logic
  controllers/     # Business logic
  integrations/    # Provider integrations (Sinch, Telnyx)
  middleware/      # Auth, rate limiting, validation
  models/          # Mongoose models
  routes/          # API routes
  services/        # Core services (fax, usage, billing)
  utils/           # Helpers, validators, env checks

🔌 API Endpoints

Fax

POST /fax/send

GET /fax/:id

GET /fax

DELETE /fax/:id

Agents

POST /agents/audit-code

POST /agents/troubleshoot

POST /agents/route

Auth

POST /auth/login

POST /auth/register

Explore the API reference.

🧰 Environment Variables

Category

Variable

Core

PORT, MONGODB_URI, JWT_SECRET

AI

OPENAI_API_KEY

Sinch

SINCH_KEY_ID, SINCH_KEY_SECRET, SINCH_PROJECT_ID, SINCH_FAX_NUMBER

Telnyx

TELNYX_API_KEY, TELNYX_CONNECTION_ID, TELNYX_WEBHOOK_SECRET

Audit Agent

AUDIT_AGENT_URL, AUDIT_AGENT_KEY

Security

ALLOWED_FILE_HOSTS

Learn about environment configuration.

🧪 Running Locally

Install dependencies:

npm install

Start development server:

npm run dev

Start production server:

npm start

🔐 Security & Compliance

FaxNova includes:

SSRF‑safe file URL validation

Provider‑safe routing

Strict input validation

Webhook signature verification

Audit logging

Error normalization

See the security overview.

🤖 Audit Agent CI (Included)

This repository includes a GitHub Action that:

Runs the Audit Agent

Parses issues

Posts PR comments

Blocks merges on critical issues

This ensures continuous hardening and boosts acquisition valuation.

Learn more about the Audit Agent CI.

🗺️ Roadmap

Next.js dashboard

Team accounts + RBAC

Usage analytics

Provider failover UI

Mobile app (FlutterFlow)

Explore the roadmap.

📞 Contact

Charles LocklearFounder, NovaStack TechnologiesLaurinburg, NC
