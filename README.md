# 📡 FaxNova Backend  
### Multi‑Provider AI‑Driven Fax Routing Engine (Sinch + Telnyx)

FaxNova is a carrier‑grade, AI‑powered fax orchestration backend designed for reliability, compliance, and intelligent routing.  
It integrates multiple fax providers, applies predictive analytics, and uses a multi‑agent AI system to troubleshoot, classify, and route faxes in real time.

---

## 🚀 Features

### 🔀 Multi‑Provider Routing Engine
- Intelligent routing between **Sinch** and **Telnyx**
- Provider‑specific rules, regions, and capabilities
- HIPAA‑aware routing with encryption enforcement

### 🔁 Retry & Failover Intelligence
- Provider‑specific retry limits and delays  
- Immediate failover on critical error codes  
- Automatic provider switching when thresholds are exceeded  
- Area‑code‑aware routing bias

### ⚠️ Outage Detection
- Real‑time provider health scoring  
- Error‑rate monitoring  
- Latency tracking  
- Automatic provider degradation → failover logic

### 💵 Provider Billing Engine
- Cost‑per‑page modeling  
- Retry cost multipliers  
- Failover cost multipliers  
- Region surcharges  
- SLA penalty modeling  
- True provider cost calculation per fax

### 📊 Provider Performance Analytics
- Latency scoring  
- Error‑rate scoring  
- Retry‑rate scoring  
- SLA score  
- Cost efficiency score  
- Stability score  
- Unified **performanceScore (0–100)**

### 🤖 AI Agent System
Six specialized agents:
- **Routing Agent** — determines provider, retries, failover  
- **Troubleshooting Agent** — explains failures, logs, provider issues  
- **Billing Agent** — cost breakdowns, margin analysis  
- **Sales Agent** — demos, feature explanations  
- **Compliance Agent** — HIPAA, audit logs, security context  
- **Onboarding Agent** — guides new users

### 🧠 Provider Context Engine
Every fax request receives a unified provider context containing:
- Routing rules  
- Retry rules  
- Outage health  
- Failover metadata  
- Billing rates  
- Performance analytics  
- Error maps  
- Logs  
- Region + HIPAA metadata  

---

## 🏗️ Architecture Overview


/src ├── agents/                 # AI agent logic ├── models/                 # Mongoose models ├── routes/                 # API routes (agentRoutes.js, faxRoutes.js) ├── services/               # Provider intelligence layer │    ├── providerContextService.js │    ├── providerRoutingRules.js │    ├── providerOutageService.js │    ├── providerBillingService.js │    ├── providerPerformanceService.js │    ├── faxMetadataService.js │    ├── extractionService.js │    └── classifierService.js ├── middleware/             # Auth, API key validation └── utils/                  # Helpers, constants


---

## 🔌 Provider Intelligence Layer

### `providerContextService.js`
Builds the unified provider context:
- Logs  
- Error maps  
- Retry rules  
- Failover rules  
- Outage health  
- Billing rates  
- Performance analytics  

### `providerRoutingRules.js`
Defines provider‑specific:
- Regions  
- Retry limits  
- Failover targets  
- Immediate failover errors  
- Area‑code bias  

### `providerOutageService.js`
Tracks:
- Error rate  
- Latency  
- Provider health (HEALTHY / DEGRADED / DOWN)

### `providerBillingService.js`
Computes:
- Cost per page  
- Retry cost  
- Failover cost  
- Region surcharges  
- SLA penalties  

### `providerPerformanceService.js`
Computes:
- SLA score  
- Cost score  
- Stability score  
- Performance score  

---

## 🧪 API Endpoints

### `/agents/routing`
AI‑driven routing decision using:
- Provider context  
- Classification  
- Extracted fields  
- Logs  
- Metadata  

### `/agents/troubleshoot`
Explains:
- Provider failures  
- Error codes  
- Outage conditions  
- Retry behavior  

### `/agents/billing`
Breaks down:
- Provider cost  
- Margin  
- Failover impact  

### `/agents/compliance`
HIPAA + audit log analysis.

### `/agents/sales`
Demo + feature explanation.

### `/agents/onboarding`
Guided onboarding.

---

## 🔐 Security & Compliance
- API key authentication  
- HIPAA‑aware routing  
- Provider isolation  
- Encrypted metadata  
- Audit logs  

---

## 🛠️ Tech Stack
- Node.js  
- Express  
- MongoDB / Mongoose  
- OpenAI (AI agents)  
- Sinch Fax API  
- Telnyx Fax API  

---

## 📈 Roadmap
- Provider SLA scoring  
- Weighted routing engine  
- Provider score history  
- Customer margin analytics  
- Provider performance dashboard  
- Event bus + webhook normalization  
- TypeScript migration  

---

## 🧑‍💻 Author
**Charles Locklear**  
Founder, NovaStack Technologies LLC  
Builder of FaxNova + NovaRegula Suite

---

## 📄 License
MIT License
