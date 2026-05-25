# FaxNova Backend
Production‑ready Node.js fax backend with multi‑provider support (Sinch + Telnyx), rate limiting, security middleware, environment validation, and clean modular architecture.

## 🚀 Overview
FaxNova is a lightweight, reliable FOIP backend designed for SaaS builders, developers, and businesses that need to send and receive faxes programmatically.  
It supports **multiple fax providers**, automatic failover, secure request handling, and modern Express best practices.

This backend is optimized for:
- Micro‑SaaS products  
- API‑only fax services  
- Serverless or container deployments  
- Render, Railway, Fly.io, and Docker environments  

---

## ✨ Features
- **Multi‑Provider Fax Support** (Sinch + Telnyx)
- **Automatic Provider Failover**
- **Pinned Dependencies** for reproducible builds
- **Environment Validation** (`validateEnv.js`)
- **Security Middleware** (Helmet, Rate Limiting, CORS)
- **Request Logging** (Morgan)
- **UUID‑based request tracking**
- **Clean Express architecture**
- **Production‑ready `.env.example`**

---

## 📦 Tech Stack
- **Node.js 20.x**
- **Express 4**
- **Axios**
- **Helmet**
- **express‑rate‑limit**
- **Telnyx Node SDK**
- **dotenv**
- **nodemon (dev)**

---

## 📁 Project Structure
