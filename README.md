FaxNova Backend

Multi‑Provider Fax Infrastructure for Modern Compliance, Reliability & Scale

FaxNova Backend is a production‑grade communications infrastructure service designed for organizations that require high‑deliverability faxing, provider redundancy, data‑residency controls, and AI‑assisted operations.

Built on Node.js + Express, FaxNova delivers a modular, acquisition‑ready architecture that integrates seamlessly with Sinch and Telnyx while providing intelligent routing, automated troubleshooting, and enterprise‑grade observability.

🚀 Platform Overview

FaxNova Backend provides:

Multi‑provider fax delivery with automatic failover

Residency‑aware routing for sovereignty‑sensitive workloads

Webhook ingestion with signature validation

AI‑powered agents for routing, compliance, billing, and troubleshooting

Secure authentication with JWT + rate limiting

Provider‑agnostic abstraction layer for future expansion

Automated code audits via CI‑driven Audit Agent

FaxNova is engineered for high availability, regulatory alignment, and SaaS‑grade scalability.

🧱 Core Capabilities

1. Multi‑Provider Fax Delivery

Intelligent provider selection (Sinch + Telnyx)

Automatic failover on provider outage or degraded performance

Provider‑specific metadata normalization

Delivery status tracking + webhook ingestion

Unified outbound fax pipeline

Explore the provider routing engine.

2. Residency & Sovereignty Engine

FaxNova includes a residency policy layer that ensures outbound faxes comply with:

US‑only routing

EU‑sovereign routing

Global routing

Provider‑level residency constraints

This enables enterprise customers to meet GDPR, tribal sovereignty, and regulated‑industry requirements.

Learn about the residency model.

3. AI‑Powered Internal Agents

FaxNova ships with a suite of internal agents that automate operational intelligence:

Troubleshooting Agent

Routing Agent

Compliance Agent

Billing Agent

Sales Agent

Code Audit Agent (CI‑integrated)

These agents reduce engineering overhead and accelerate debugging, compliance checks, and routing decisions.

Explore the AI agent system.

4. Secure, Modern Architecture

JWT authentication

Role‑based access

Rate limiting

Input validation

SSRF‑safe file URL validation

Provider isolation

Environment validation

Structured audit logging

See the security model.

5. Automated Code Audits (CI)

Every push and pull request triggers:This dramatically increases acquisition readiness and reduces long‑term maintenance risk.

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
