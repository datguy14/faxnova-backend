# FaxNova Backend - Deployment Checklist

Production-ready deployment guide for **FaxNova v1.1.0** (Multi-Provider + Swagger).

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (Critical)

Copy and configure `.env` from `env.example`:

**Must be set:**
- `MONGO_URI` — MongoDB connection string
- `DEFAULT_FAX_PROVIDER` — `sinch` or `telnyx`
- Sinch credentials (`SINCH_API_KEY`, `SINCH_API_SECRET`, `SINCH_PROJECT_ID`)
- Telnyx credentials (`TELNYX_API_KEY`, `TELNYX_CONNECTION_ID`)
- `JWT_SECRET`, `API_KEY_HASH_SECRET`, `WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY` (for future billing)

### 2. Dependencies

```bash
npm install
