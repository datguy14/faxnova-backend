# FaxNova Backend

**Modern Multi-Provider Fax API Backend**  
A lightweight, production-ready Node.js fax delivery engine with **Sinch + Telnyx** support (and easy extensibility for more providers).

Built for reliability, clean handoff, and fast monetization — perfect for vertical SaaS (healthcare, legal, finance), internal tools, or as an acquisition-ready micro-SaaS asset.

---

## 🚀 Features

- **Multi-Provider Routing** — Native support for **Sinch** and **Telnyx** with smart fallback
- **Unified Interface** — Same API regardless of provider
- **Production Architecture** — Clean separation (controllers, services, integrations, middleware)
- **Automatic Fallback** — Configurable primary + fallback routing
- **Webhook Normalization** — Consistent status events from any provider
- **Rate Limiting** — Tiered (Free / Pro / Business)
- **Audit Logging** — Full request & event tracking
- **OpenAPI Spec** — Complete API documentation
- **Easy Deployment** — Ready for Render, Railway, Fly.io, etc.
- **MIT Licensed** — Fully commercial use allowed

---

## ✨ Multi-Provider Highlights

- Send faxes via Sinch (strong HIPAA/compliance focus) or Telnyx (lower cost + private network)
- Per-request provider override (`provider: "telnyx"`)
- Automatic fallback on failure
- Centralized router with health checks
- Provider-aware status tracking and webhooks

---

## 🛠️ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/datguy14/faxnova-backend.git
cd faxnova-backend
npm install
