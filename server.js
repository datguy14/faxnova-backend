import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";
import faxRoutes from "./src/routes/faxRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import auth from "./src/middleware/auth.js"; // ⭐ Add auth middleware

dotenv.config();

const app = express();

// ⭐ SECURE FAXNOVA CORS CONFIG
const allowedOrigins = [
  "https://dashboard.faxnova.com",
  "https://admin.faxnova.com",
  "http://localhost:5173" // dev
];

app.use(
  cors({
    origin: function (origin, callback) {
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

// ⭐ CORS ERROR HANDLER
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }
  next(err);
});

// JSON parser
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "FaxNova backend is running" });
});

// ⭐ PROTECT FAX ROUTES WITH AUTH
app.use("/fax", auth, faxRoutes);

// ⭐ Webhooks stay public (providers must reach them)
app.use("/webhook", webhookRoutes);

// Database connection
connectDB();

// Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
