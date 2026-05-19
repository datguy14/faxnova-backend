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
2. Environment Setup
cp env.example .env
Edit .env with your credentials (see Environment Variables below).
3. Run Locally
npm run dev
📡 API Endpoints
Method
Endpoint
Description
POST
/fax/send
Send a fax (multi-provider)
GET
/fax/status/:id
Get fax status (provider-aware)
GET
/fax/providers
List available providers + config
POST
/fax/webhook
Incoming webhooks (normalized)
Example Send Request:
{
  "to": "+15551234567",
  "fileUrl": "https://example.com/document.pdf",
  "from": "+15557654321",
  "provider": "telnyx"          // optional: sinch | telnyx
}
🔐 Environment Variables
See the full env.example for the complete list.
Key Multi-Provider Variables:
DEFAULT_FAX_PROVIDER=sinch
ENABLE_PROVIDER_FALLBACK=true
FALLBACK_DELAY_MS=3000

# Sinch
SINCH_API_KEY=
SINCH_API_SECRET=
SINCH_PROJECT_ID=
SINCH_FAX_NUMBER=

# Telnyx
TELNYX_API_KEY=
TELNYX_CONNECTION_ID=
TELNYX_FROM_NUMBER=

# General
STRIPE_SECRET_KEY=           # For future monetization
JWT_SECRET=
WEBHOOK_SECRET=
🧱 Project Structure
faxnova-backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── integrations/
│   │   ├── providers/        # sinchProvider.js, telnyxProvider.js
│   │   └── faxRouter.js      # Central multi-provider logic
│   ├── routes/               # Express routes
│   ├── services/             # Business logic
│   ├── middleware/           # Rate limiting, auth, etc.
│   ├── models/               # MongoDB models
│   └── utils/                # Logger, helpers
├── public/.well-known/       # Domain verification
├── openapi.yaml              # API specification
├── env.example
├── DEPLOYMENT_CHECKLIST.md
├── FAX_LIFECYCLE.md
└── package.json
🚀 Deployment
Fully compatible with:
Render (recommended)
Railway
Fly.io
AWS Lightsail / ECS
Any Node.js platform with environment variable support
See DEPLOYMENT_CHECKLIST.md for step-by-step instructions.
🧪 Testing Providers
# Check available providers
curl http://localhost:3000/fax/providers
📈 Monetization Ready
This backend is designed for quick conversion into a paid micro-SaaS:
Markup per-page costs (Sinch ~$0.045, Telnyx cheaper)
Tiered plans with rate limits
Stripe integration ready
Vertical focus: Healthcare (Sinch), General/High-Volume (Telnyx)
📄 Documentation
DEPLOYMENT_CHECKLIST.md
FAX_LIFECYCLE.md
openapi.yaml — Full API spec
📜 License
MIT License — Free for personal and commercial use.
🤝 Acquisition Friendly
Clean, well-documented codebase
Low operational overhead
Multi-provider resilience
Easy to extend (new providers, frontend dashboard, billing)
Ideal for buyers looking to own a niche fax/compliance micro-SaaS.
Made with ❤️ for reliable document delivery
Questions or want to contribute? Open an issue or reach out.
This README is now **professional, buyer-ready for Acquire.com**, and fully reflects all the multi-provider upgrades we've implemented.

Would you like me to also update any of these supporting files next?
- `DEPLOYMENT_CHECKLIST.md`
- `openapi.yaml` (add provider field)
- Or create a `CONTRIBUTING.md`? 

Just tell me what’s next!
