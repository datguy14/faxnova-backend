FaxNova Backend
Production‑ready Node.js fax backend with multi‑provider support (Sinch + Telnyx), rate limiting, security middleware, environment validation, and clean modular architecture.

---

🏷️ Buyer‑Ready Acquisition Summary
FaxNova is a fully built, production‑ready fax delivery backend designed for developers, SaaS founders, and companies that need a modern alternative to legacy fax infrastructure. It provides a clean, scalable Node.js architecture with multi‑provider fax delivery (Sinch + Telnyx), automatic failover, webhook lifecycle handling, and a complete deployment pipeline.

This is not a prototype — it is a turnkey backend system that a buyer can deploy, extend, or productize immediately.

---

🧾 Included in the Sale
The acquisition includes 100% of the FaxNova backend codebase, documentation, deployment assets, and operational tooling required to run, extend, or commercialize the product immediately.

1. Complete Production‑Ready Backend
- Full Node.js backend using a clean, scalable /src architecture
- Modular provider system with Sinch and Telnyx fax delivery
- Automatic provider failover logic
- Unified error handling and response formatting
- Health, version, and status endpoints
- UUID‑based request tracing
- Fully pinned dependencies for reproducible builds

2. Provider Integrations
- Complete Sinch fax provider implementation
- Complete Telnyx fax provider implementation
- Provider factory for easy expansion
- Shared request/response normalization
- Status polling + delivery tracking

3. Documentation & Specs
- OpenAPI 3.0 specification (openapi.yaml)
- FAX_LIFECYCLE.md — full inbound/outbound fax lifecycle
- DEPLOYMENT_CHECKLIST.md — production readiness checklist
- SECURITY.md — security posture and best practices
- README.md — full API reference, deployment guide, troubleshooting guide

4. Deployment & Ops
- Render deployment guide
- Render troubleshooting guide
- .well-known directory for domain verification
- Production‑ready .env.example
- Environment validation system (validateEnv.js)
- Logging middleware with correlation IDs
- Security middleware (Helmet, CORS, rate limiting)

5. Source Code & Project Assets
- Entire GitHub repository
- Clean, verified commit history
- MIT license (commercial‑friendly)
- All scripts, utilities, and configuration files
- server.js entrypoint
- package.json with pinned versions

6. Transfer of Ownership
The buyer receives:
- Full IP rights
- Full code ownership
- Full documentation ownership
- Full deployment rights
- Full commercial rights

No dependencies on the original founder.  
No proprietary services.  
No vendor lock‑in.

---

⚙️ Tech Highlights
- Multi‑provider fax engine with Sinch + Telnyx
- Automatic failover for high deliverability
- Provider‑agnostic architecture (easy to add Twilio, InterFAX, etc.)
- OpenAPI‑driven development
- Secure by default: Helmet, CORS, rate limiting, UUID tracing
- Environment validation ensures safe deployments
- Production‑ready: pinned dependencies, clean logs, health endpoints
- Deployable in under 10 minutes on Render

---

🚀 Overview
FaxNova is a lightweight, reliable FOIP backend designed for SaaS builders, developers, and businesses that need to send and receive faxes programmatically.  
It supports multiple fax providers, automatic failover, secure request handling, and modern Express best practices.

This backend is optimized for:
- Micro‑SaaS products
- API‑only fax services
- Serverless or container deployments
- Render, Railway, Fly.io, and Docker environments

---

✨ Features
- Multi‑Provider Fax Support (Sinch + Telnyx)
- Automatic Provider Failover
- Pinned Dependencies
- Environment Validation
- Security Middleware
- Request Logging
- OpenAPI Specification
- Clean /src architecture
- Production‑ready .env.example

---

🧰 Tech Stack
- Node.js 20.x
- Express 4
- Axios
- Helmet
- express‑rate‑limit
- Telnyx Node SDK
- dotenv
- nodemon (dev)

---

📁 Project Structure (Using /src Architecture)
`
faxnova-backend/
│
├── public/
│   └── .well-known/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── providers/
│   └── utils/
│
├── .github/
├── .env.example
├── DEPLOYMENT_CHECKLIST.md
├── FAX_LIFECYCLE.md
├── LICENSE
├── openapi.yaml
├── package.json
├── server.js
└── SECURITY.md
`

---

🔧 Installation
`
git clone https://github.com/datguy14/faxnova-backend.git (github.com in Bing)
cd faxnova-backend
npm install
cp .env.example .env
`

---

🔐 Environment Variables
All required variables are documented in .env.example.

Server
- PORT  
- NODE_ENV  

Security
- JWT_SECRET  
- RATELIMITWINDOW_MS  
- RATELIMITMAX  

Sinch
- SINCHAPIKEY  
- SINCHAPISECRET  
- SINCHSERVICEPLAN_ID  
- SINCHFAXNUMBER  

Telnyx
- TELNYXAPIKEY  
- TELNYXCONNECTIONID  
- TELNYXFAXNUMBER  

Failover
- ENABLEPROVIDERFAILOVER  
- PRIMARY_PROVIDER  

---

📡 API Reference

Base URL
Production:
`
https://your-domain.com
`

Local:
`
http://localhost:3000
`

---

1. Send Fax — POST /fax/send
`
{
  "to": "+15551234567",
  "from": "+15557654321",
  "pdfUrl": "https://example.com/document.pdf"
}
`

---

2. Get Fax Status — GET /fax/status/:id
`
{
  "success": true,
  "provider": "telnyx",
  "faxId": "abc123",
  "status": "delivered"
}
`

---

3. Health Check — GET /health
`
{ "status": "ok" }
`

---

4. Version — GET /version
`
{ "version": "1.1.0" }
`

---

🧪 Running the Server

Development
`
npm run dev
`

Production
`
npm start
`

---

🛡 Security
FaxNova includes:
- Helmet  
- Rate limiting  
- CORS  
- UUID request tracking  
- Environment validation  

---

🚀 Render Deployment Guide

1. Create a New Web Service
- Log in to Render  
- New → Web Service  
- Connect GitHub  
- Select faxnova-backend  
- Choose main  

2. Build & Runtime Settings
Build:
`
npm install
`
Start:
`
npm start
`

3. Add Environment Variables
Copy everything from .env.example.

4. Deploy
Render will clone, install, and start automatically.

5. Verify
- /health
- /version
- Test fax via /fax/send

---

🛠 Render Troubleshooting Guide

Build Fails
Run npm install locally to confirm no dependency issues.

Missing Environment Variables
Ensure all .env.example values are added.

PDF URL Not Accessible
Use a public HTTPS link or S3 bucket.

Provider Errors
Verify Sinch/Telnyx credentials.

App Crashes on Boot
Check Render logs for missing env vars.

Slow Boot / Cold Starts
Upgrade from free tier.

---

📜 License
MIT License — free for commercial and private use.

---

🤝 Contributing
Pull requests welcome.

---

🧩 Roadmap
- FaxNova UI dashboard  
- Provider‑agnostic webhook ingestion  
- Multi‑tenant support  
- Stripe billing integration  
- Fax queue + retry engine  
`
