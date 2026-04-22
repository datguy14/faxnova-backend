# FaxNova Fax Lifecycle

## 1. Send
Client calls `/fax/send` → FaxNova sends job to Sinch.

## 2. Webhook
Sinch calls `/fax/webhook` with:
- delivered
- failed
- queued
- retryable

## 3. Status
Client polls `/fax/status/{id}` for real-time state.

## 4. Retry
If failed and retryable → `/fax/retry/{id}` triggers new attempt.

## 5. Event History
Webhook events are logged for auditability.
