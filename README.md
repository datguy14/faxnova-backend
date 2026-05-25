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

📡 API Endpoints

POST /fax/send
Send a fax using the configured provider (or failover).

GET /fax/status/:id
Retrieve fax delivery status.

GET /health
Health check endpoint (if enabled).

---

🛡 Security

FaxNova includes:
- Helmet for HTTP header hardening  
- Rate limiting  
- CORS configuration  
- UUID request tracking  
- Environment validation  

---

🧱 Deployment

FaxNova is optimized for:
- Render  
- Railway  
- Fly.io  
- Docker  
- Bare‑metal Node servers  

Render Notes
- Set all environment variables in the Render dashboard  
- Node version is pinned via engines.node  
- Build command: npm install  
- Start command: npm start  

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
