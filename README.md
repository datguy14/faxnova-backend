FaxNova — Production‑Ready Fax Delivery API (Sinch Fax API)

FaxNova is a clean, modern, production‑ready fax delivery backend built with Node.js, Express, and the Sinch Fax API.  
It is engineered for clarity, stability, and immediate transferability — ideal for acquisition, integration, or white‑label use.

This backend provides a simple outbound fax‑sending endpoint, structured error handling, correlation‑ID tracing, and a deployment‑ready architecture suitable for Render, Railway, Fly.io, or any Node‑compatible host.

---

🚀 Features

✅ Outbound Fax Sending (Sinch Fax API)
- Single POST endpoint for sending faxes  
- Uses Sinch’s v3 Fax API  
- Supports PDF URLs via contentUrl  
- Returns fax ID, submission status, and correlation ID  

✅ Structured Error Handling
- Normalized, consistent error responses  
- Includes:
  - message
  - details
  - payload
  - correlationId
  - timestamp
  - status
- Perfect for dashboards, logging, and debugging

✅ Clean, Transfer‑Ready Architecture
- Minimal dependencies  
- Clear folder structure  
- Environment‑variable driven  
- Easy to extend (inbound faxing, OCR, AI, billing, etc.)

✅ Deployment‑Ready
- Works out‑of‑the‑box on Render  
- Includes env.example  
- Includes openapi.yaml for API documentation  
- Lightweight and stateless  

---

📁 Project Structure

`
faxnova-backend/
│
├── src/
│   ├── controllers/
│   │   └── faxController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── normalizeError.js
│   └── server.js
│
├── openapi.yaml
├── env.example
├── package.json
└── README.md
`

---

🔧 Environment Variables

Copy .env.example to .env and fill in:

`
SINCHPROJECTID=yourprojectid
SINCHKEYID=yourkeyid
SINCHKEYSECRET=yourkeysecret
SINCHFAXNUMBER=+15551234567
PORT=3000
`

---

📬 Sending a Fax (Example Request)

`bash
POST /send-fax
Content-Type: application/json

{
  "to": "+15551234567",
  "fileUrl": "https://example.com/document.pdf"
}
`

Example Response

`json
{
  "success": true,
  "faxId": "abc123",
  "status": "submitted",
  "correlationId": "req-xyz-789"
}
`

---

❗ Error Response Format

All errors return a structured JSON object:

`json
{
  "error": true,
  "code": 422,
  "message": "Fax send failed",
  "type": "SinchError",
  "details": { ... },
  "payload": { ... },
  "correlationId": "req-xyz-789",
  "timestamp": "2026-05-09T17:22:00.123Z"
}
`

This makes FaxNova ideal for dashboards, monitoring, and debugging.

---

🛠️ Scripts

`
npm install
npm run dev
npm start
`

---

📦 Dependencies

- express  
- axios  
- uuid (for correlation IDs)

---

🧩 Extending FaxNova

FaxNova is intentionally minimal — perfect for extending into:

- Inbound faxing  
- AI‑powered OCR + document extraction  
- Fax inbox dashboard  
- Multi‑tenant SaaS  
- Usage‑based billing (Stripe)  
- HIPAA‑ready workflows  
- AI classification, routing, redaction  

---

📄 License

MIT License — free for commercial use, resale, and modification.

---

💼 Acquisition Notes

FaxNova is engineered for:

- Clean code transfer  
- Immediate deployment  
- Easy integration into existing systems  
- SaaS expansion or white‑labeling  
- AI‑powered document intelligence add‑ons  

This backend is ideal for founders, agencies, MSPs, healthcare IT vendors, or automation platforms needing reliable fax infrastructure.
`
