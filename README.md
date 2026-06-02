  integrations/     # Provider integrations (Sinch, Telnyx)
  middleware/       # Auth, rate limiting, validation
  models/           # Mongoose models
  routes/           # API routes
  services/         # Core services (fax, usage, billing)
  utils/            # Helpers, validators, env checks

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

🛠️ Environment Variables

PORT=
MONGO_URI=
JWT_SECRET=

# Providers
SINCH_API_KEY=
SINCH_API_SECRET=
TELNYX_API_KEY=

# AI
OPENAI_API_KEY=

# Audit Agent
AUDIT_AGENT_URL=
AUDIT_AGENT_KEY=

# Allowed file hosts (SSRF protection)
ALLOWED_FILE_HOSTS=

Learn about environment configuration.

🧪 Running Locally

Install dependencies

npm install

Start development server

npm run dev

Start production server

npm start

🔐 Security & Compliance

FaxNova Backend includes:

SSRF‑safe file URL validation

Provider‑safe routing

Strict input validation

Webhook signature verification

Audit logging

Error normalization

See security overview.

🤖 Audit Agent CI (Included)

This repo includes a GitHub Action that:

Runs the Audit Agent

Parses issues

Posts PR comments

Fails on critical issues

This ensures continuous code quality and boosts acquisition valuation.

Learn more about the Audit Agent.

🧭 Roadmap (Optional for Buyers)

Frontend dashboard (Next.js)

Team accounts + RBAC

Usage analytics

Provider failover UI

Mobile app (FlutterFlow)

Explore the roadmap.

📬 Contact

For acquisition inquiries or technical questions, contact:

Charles LocklearFounder, NovaStack TechnologiesLaurinburg, NC
