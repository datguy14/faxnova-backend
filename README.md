# FaxNova Backend

A lightweight, production‑ready fax delivery API built with **Node.js**, **Express**, and the **Sinch Fax API (v3)**.

FaxNova Backend provides a clean, minimal REST endpoint for sending faxes through Sinch. The architecture is intentionally simple — easy to deploy, easy to maintain, and easy for a new owner to understand at a glance.

---

## Features

- Send faxes using the **Sinch Fax API v3**
- Clean separation of routes, controllers, and utilities
- Minimal dependencies for fast startup and low overhead
- Environment‑variable–driven configuration
- Fully compatible with Render, Railway, or any Node hosting platform
- MIT‑licensed and acquisition‑friendly
- Twilio code fully removed for clarity and maintainability

---

## Tech Stack

| Layer      | Technology        |
|-----------|-------------------|
| Runtime   | Node.js           |
| Framework | Express           |
| HTTP      | Axios             |
| Fax API   | Sinch Fax API v3  |
| Config    | dotenv            |
| Hosting   | Render            |

---

## Project Structure

```text
faxnova-backend/
├── controllers/
│   └── faxController.js     # Handles fax-sending logic via Sinch
├── routes/
│   └── faxRoutes.js         # API routes
├── utils/
│   └── (utility modules)    # Helper functions
├── server.js                # Express server entry point
├── package.json
└── README.md
---

## Environment Variables

Create a `.env` file with:

```
SINCH_KEY_ID=your_key_id
SINCH_KEY_SECRET=your_key_secret
SINCH_PROJECT_ID=your_project_id
```

These values come from your Sinch dashboard.

---

## API Endpoint

### POST /send-fax

Send a fax using Sinch.

**Request body:**

```json
{
  "to": "+15551234567",
  "contentUrl": "https://example.com/document.pdf"
}
```

**Example response:**

```json
{
  "status": "queued",
  "faxId": "abc123"
}
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Server runs at:

```
http://localhost:3000
```

---

## Deployment

FaxNova Backend is optimized for:

- Render  
- Railway  
- Heroku  
- Any Node.js hosting platform  

Set your environment variables and deploy.

---

## License

MIT License — free for commercial use, modification, and resale.
