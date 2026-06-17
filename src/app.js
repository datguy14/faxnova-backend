// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import faxRoutes from "./routes/faxRoutes.js";
import faxWebhookRoutes from "./routes/faxWebhookRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";

import auth from "./middleware/auth.js";
import requestLogger from "./middleware/requestLogger.js";
import correlationId from "./middleware/correlationId.js";
import errorHandler from "./middleware/errorHandler.js";
import residencyGuard from "./middleware/residencyGuard.js";

dotenv.config();

const app = express();

// -----------------------------------------------------
// CORS (Sovereignty + Residency Safe)
// -----------------------------------------------------
const allowedOrigins = [
  "https://dashboard.faxnova.com",
  "https://admin.faxnova.com",
  "http://localhost:5173"
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-tribal-auth",
      "x-faxnova-zone"
    ],
    exposedHeaders: [
      "x-residency-zone",
      "x-provider-route",
      "x-sovereignty-status"
    ],
    credentials: true
  })
);

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }
  next(err);
});

// -----------------------------------------------------
// Core Middleware
// -----------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(correlationId);
app.use(requestLogger);

// -----------------------------------------------------
// Health Check
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({ message: "FaxNova backend is running" });
});

// -----------------------------------------------------
// Protected Routes
// -----------------------------------------------------
app.use("/fax", auth, residencyGuard, faxRoutes);
app.use("/providers", auth, providerRoutes);
app.use("/analytics", auth, analyticsRoutes);

// -----------------------------------------------------
// Public Webhooks (Providers must reach these)
// -----------------------------------------------------
app.use("/webhook", faxWebhookRoutes);

// -----------------------------------------------------
// Error Handler
// -----------------------------------------------------
app.use(errorHandler);

export default app;
