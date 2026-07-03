FaxNova Backend — Strict‑Mode Edition

A horizontally scalable, provider‑agnostic fax‑sending backend built with Node.js, Redis, and a unified provider diagnostics stack.This backend powers FaxNova’s real‑time routing engine, outage detection, webhook ingestion, and worker pipeline.

🚀 Features

Unified provider stack (Outage, Health, Performance, Latency, Routing)

Percentile‑weighted routing (EWMA + p95 + p99)

Deterministic Redis‑backed state

Outage‑aware retry gating

Exponential backoff (2^attempts, capped at 60s)

Secure webhook ingestion (HMAC SHA‑256 + idempotency)

Structured diagnostics for all providers

Horizontally scalable worker pipeline

Comprehensive strict‑mode JSDoc coverage

20+ integration tests (pipeline, routing, webhook, Redis)

🏗 Architecture Overview

Provider Stack

providerOutageService — outage state, cooldown, probation

providerHealthService — degraded/half‑open/down

providerPerformanceService — scoring

providerLatencyTracker — EWMA + p95 + p99

providerRoutingEngine — composite scoring

Worker Pipeline

outboundFaxWorker — sends fax

retryFaxWorker — exponential backoff + outage gating

webhookWorker — applies provider feedback

Controllers

provider.controller.js

webhookController.js

healthController.js

All controllers now use:

strict error normalization

structured JSON responses

unified diagnostics

consistent logging

📡 Routing Engine (EWMA + p95 + p99)

Providers are scored using:

performance score

health penalties

outage penalties

EWMA latency

p95 tail latency

p99 extreme latency

This ensures the best provider is selected under real‑world load.

🔐 Webhook Security

HMAC SHA‑256 signature verification

timing‑safe comparison

idempotency via externalEventId

duplicate‑event protection

structured error responses

📊 Diagnostics

Each provider exposes:

{
  provider,
  health,
  outageState,
  score,
  failures,
  lastFailureAt,
  openedAt,
  probationUntil,
  cooldownRemaining,
  latency: {
    ewma,
    p95,
    p99
  }
}

🧪 Testing

Included test suites:

Provider routing engine tests

Worker chain integration tests

Webhook security tests

Redis consistency tests

Error recovery tests

End‑to‑end pipeline tests

Run tests:

npm test

🗑 Deprecated Engines Removed

providerCircuitBreaker.js

providerResidencyEngine.js

providerCapabilitiesEngine.js

All references removed.

🚀 Deployment

Environment variables:

REDIS_URL=
SINCH_API_KEY=
TELNYX_API_KEY=
WEBHOOK_SECRET=

Start workers:

npm run workers

Start API:

npm start

📞 Support

For issues, open a GitHub issue or contact the FaxNova engineering team.
