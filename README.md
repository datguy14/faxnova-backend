 FaxNova Backend — Multi‑Provider Fax Infrastructure (Acquisition‑Ready)

A production‑grade backend powering FaxNova: a modern, AI‑enhanced, multi‑provider fax delivery platform built for reliability, compliance, and scale.

🚀 Overview

FaxNova Backend is a Node.js + Express service that provides:

Multi‑provider fax delivery (Sinch + Telnyx)

Webhook ingestion + metadata extraction

AI‑powered troubleshooting, routing, compliance, and billing agents

Secure authentication, rate limiting, and validation

Modular, scalable architecture ready for SaaS growth

CI‑powered automated code audits via the Audit Agent

This backend is engineered for high deliverability, provider redundancy, and enterprise‑grade reliability.

Learn more about the architecture.

🧱 Core Features

1. Multi‑Provider Fax Delivery

Provider factory abstraction

Automatic failover

Provider‑specific metadata normalization

Webhook signature validation

Delivery status tracking

Explore provider integrations.

2. AI‑Powered Agent System

FaxNova includes a suite of internal agents:

Troubleshooting Agent

Routing Agent

Compliance Agent

Billing Agent

Sales Agent

Code Audit + Auto‑Fix Agent

These agents enhance reliability, automate debugging, and reduce operational overhead.

Learn about the AI agent system.

3. Secure, Modern Architecture

JWT authentication

Role‑based access

Rate limiting

Input validation

SSRF‑safe file URL validation

Provider isolation

Environment validation

See the security model.

4. Automated Code Audits (CI)

This repository includes a GitHub Action that:

Runs the Audit Agent on every push + PR

Parses issues

Posts results as PR comments

Blocks merges on critical issues

This ensures continuous hardening and boosts acquisition value.

View the Audit Agent CI.
View the Audit Agent CI.

📂 Project Structure

src/
  agents/           # AI agent handlers
  audit/            # Audit Agent logic
  controllers/      # Business logic
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

🧰 Environment Variables

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

See the security overview.

🤖 Audit Agent CI (Included)

This repo includes a GitHub Action that:

Runs the Audit Agent

Parses issues

Posts PR comments

Fails on critical issues

This ensures continuous code quality and boosts acquisition valuation.

Learn more about the Audit Agent.

🗺️ Roadmap (Optional for Buyers)

Frontend dashboard (Next.js)

Team accounts + RBAC

Usage analytics

Provider failover UI

Mobile app (FlutterFlow)

Explore the roadmap.

📞 Contact

For acquisition inquiries or technical questions, contact:

Charles LocklearFounder, NovaStack TechnologiesLaurinburg, NC
