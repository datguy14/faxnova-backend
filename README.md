FaxNova Backend
Production‑ready Node.js fax backend with multi‑provider support (Sinch + Telnyx), rate limiting, security middleware, environment validation, and clean modular architecture.

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
- Pinned Dependencies for reproducible builds  
- Environment Validation (validateEnv.js)  
- Security Middleware (Helmet, Rate Limiting, CORS)  
- Request Logging (Morgan)  
- UUID‑based request tracking  
- Clean Express architecture  
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

📁 Project Structure
`
faxnova-backend/
│
├── server.js
├── package.json
├── .env.example
│
├── utils/
│   └── validateEnv.js
│
├── routes/
│   └── fax.js
│
├── controllers/
│   └── faxController.js
│
├── providers/
│   ├── sinchProvider.js
│   ├── telnyxProvider.js
│   └── providerFactory.js
│
└── middleware/
    ├── errorHandler.js
    ├── requestLogger.js
    └── security.js
`

---

🔧 Installation

Clone the repo:

`
git clone https://github.com/datguy14/faxnova-backend.git (github.com in Bing)
cd faxnova-backend
`

Install dependencies:

`
npm install
`

Copy the environment template:

`
cp .env.example .env
`

Fill in your provider keys and configuration.

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

The server will not start unless all required variables are present.

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

1. Send Fax

POST /fax/send

Send a fax using the configured provider (Sinch or Telnyx).  
If failover is enabled, the secondary provider is used automatically.

Request Body
`
{
  "to": "+15551234567",
  "from": "+15557654321",
  "pdfUrl": "https://example.com/document.pdf"
}
`

Success Response
`
{
  "success": true,
  "provider": "sinch",
  "faxId": "abc123",
  "message": "Fax queued successfully"
}
`

---

2. Get Fax Status

GET /fax/status/:id

Retrieve the delivery status of a fax previously sent.

Success Response
`
{
  "success": true,
  "provider": "telnyx",
  "faxId": "abc123",
  "status": "delivered",
  "timestamp": "2026-05-25T18:22:10Z"
}
`

---

3. Health Check

GET /health

`
{
  "status": "ok",
  "uptime": 10234,
  "timestamp": 1716660000
}
`

---

4. Version

GET /version

`
{
  "version": "1.1.0"
}
`

---

5. Error Format
All errors follow a unified structure:

`
{
  "success": false,
  "error": "ErrorType",
  "details": "Human-readable explanation"
}
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
- Helmet for HTTP header hardening  
- Rate limiting  
- CORS configuration  
- UUID request tracking  
- Environment validation  

---

🚀 Render Deployment Guide

1. Create a New Web Service
1. Log in to Render  
2. Click New → Web Service  
3. Connect GitHub  
4. Select faxnova-backend  
5. Choose the main branch  

---

2. Build & Runtime Settings

Build Command
`
npm install
`

Start Command
`
npm start
`

Node Version
Automatically detected from:

`
"engines": { "node": "20.x" }
`

---

3. Add Environment Variables

Add all variables from .env.example:

- Server  
- Security  
- Sinch  
- Telnyx  
- Failover  

FaxNova will not start unless all required variables are present.

---

4. Deploy

Render will:

1. Clone the repo  
2. Install dependencies  
3. Start the server  

---

5. Verify Deployment

Health Check
`
/health
`

Version
`
/version
`

Send Fax Test
`
POST /fax/send
`

---

🛠 Render Troubleshooting Guide

1. Build Fails Immediately
Cause: Missing or invalid dependency  
Fix:  
- Ensure package.json uses pinned versions  
- Run npm install locally to confirm no errors  

---

2. “Missing Environment Variables” Error
Cause: validateEnv.js blocked startup  
Fix:  
- Open Render → Environment  
- Add all variables from .env.example  

---

3. “Cannot Access PDF URL”
Cause: PDF is not publicly accessible  
Fix:  
- Use a public S3 bucket  
- Use a direct HTTPS link  

---

4. Provider Errors (Sinch / Telnyx)
Cause: Invalid API key or number  
Fix:  
- Re‑check provider credentials  
- Ensure numbers are fax‑enabled  

---

5. App Deploys but Crashes
Cause: Missing .env values or invalid JSON  
Fix:  
- Check Render logs  
- Validate JSON formatting  

---

6. Cold Starts / Slow Boot
Cause: Free tier instance sleeping  
Fix:  
- Upgrade to Starter plan  
- Add uptime monitoring  

---

📜 License
MIT License — free for commercial and private use.

---

🤝 Contributing
Pull requests are welcome.  
For major changes, open an issue first to discuss what you’d like to modify.

---

🧩 Roadmap
- Web dashboard (FaxNova UI)  
- Provider‑agnostic webhook ingestion  
- Multi‑tenant support  
- Stripe billing integration  
- Fax queue + retry engine  
`
