
📄 FaxNova Backend — Modern Sinch Fax API Engine

A lightweight, production‑ready fax delivery backend built with Node.js, Express, and the Sinch Fax API using OAuth 2.0 Client Credentials.  
Designed for reliability, clarity, and easy handoff — ideal for SaaS products, internal tools, and acquisition‑ready codebases.

---

❤️ Support the Project

If FaxNova helps you, consider supporting ongoing development:

- Sponsor charlesnova  
- NovaFamily Sponsor Tier  
- NovaWorks Sponsor Tier  

Your support helps keep FaxNova fast, secure, and actively maintained.

---

🚀 Features

- Send faxes via Sinch Fax API using OAuth 2.0 Client Credentials  
- Automatic token refresh with secure in‑memory caching  
- Webhook‑driven status updates for real‑time delivery tracking  
- Clean architecture with controllers, services, and utilities  
- Minimal dependencies for fast startup and low operational overhead  
- Environment‑variable driven configuration  
- Ready for deployment on Render, Railway, Fly.io, or any Node hosting platform  
- MIT‑licensed and acquisition‑friendly

---

🧱 Project Structure

`
faxnova-backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── middleware/
│   └── config/
├── public/.well-known/
├── openapi.yaml
├── env.example
├── server.js
└── package.json
`

- controllers/ — request handlers  
- services/ — Sinch API logic + OAuth token management  
- routes/ — Express routing  
- utils/ — helpers (logging, validation, etc.)  
- public/.well-known/ — required for domain verification  
- openapi.yaml — API documentation  
- env.example — environment variable template  

---

🔌 API Overview

POST /fax/send
Send a fax via Sinch Fax API.

Request body:
`json
{
  "to": "+15551234567",
  "mediaUrl": "https://example.com/document.pdf"
}
`

Response:
`json
{
  "faxId": "abc123",
  "status": "queued"
}
`

POST /fax/webhook
Receives delivery status updates from Sinch.

---

🔐 Environment Variables

`
PORT=3000
SINCHCLIENTID=yourclientid
SINCHCLIENTSECRET=yourclientsecret
SINCHTOKENURL=https://auth.sinch.com/oauth2/token
SINCHFAXAPI_URL=https://fax.api.sinch.com/v1
WEBHOOKSECRET=yourwebhook_secret
`

---

🛠️ Development

Install dependencies:

`
npm install
`

Run locally:

`
npm run dev
`

---

🚀 Deployment

FaxNova Backend is fully compatible with:

- Render  
- Railway  
- Fly.io  
- AWS Lightsail  
- Any Node.js hosting platform  

Just set your environment variables and deploy.

---

📄 License

MIT License — free for commercial and private use.

---
