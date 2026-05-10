md

FaxNova Backend

![Sponsor charlesnova](https://github.com/sponsors/datguy14)
![Buy Me a Coffee](https://buymeacoffee.com/charlesnova)

FaxNova is a modern, API‑driven fax delivery backend built for reliability, speed, and developer‑friendly integration.  
This service powers secure fax sending, delivery tracking, and webhook‑based status updates for SaaS products and internal tools.

---

🚀 Features

- Fast, reliable fax delivery via Sinch
- Webhook‑driven status updates
- Secure API endpoints
- Queue‑based processing for high‑volume sending
- Clean, modular codebase ready for scaling or acquisition

---

📦 Tech Stack

- Node.js
- Express
- Sinch Fax API
- MongoDB
- Bull / Redis (optional queueing)

---

🛠️ Installation

Clone the repository:

`bash
git clone https://github.com/datguy14/faxnova-backend.git
cd faxnova-backend
`

Install dependencies:

`bash
npm install
`

---

🔧 Environment Variables

Create a .env file in the project root:

`env
PORT=3000
MONGOURI=yourmongoconnectionstring
SINCHAPIKEY=your_key
SINCHAPISECRET=your_secret
SINCHFAXREGION=us
WEBHOOK_URL=https://yourdomain.com/webhook
`

---

▶️ Running the Server

`bash
npm run dev
`

Server will start on:

`
http://localhost:3000
`

---

📡 API Endpoints

POST /fax/send
Send a fax with a PDF file and destination number.

POST /fax/webhook
Receives delivery status updates from Sinch.

---

🤝 Contributing

Pull requests are welcome.  
For major changes, open an issue first to discuss what you’d like to modify.

---

❤️ Support the Project

If FaxNova has helped you, consider supporting ongoing development:

- GitHub Sponsors: https://github.com/sponsors/datguy14  
- Buy Me a Coffee: https://buymeacoffee.com/charlesnova (buymeacoffee.com in Bing)  

Your support helps keep the project maintained and evolving.

---

📄 License

MIT License  
Copyright (c) 2026
`
