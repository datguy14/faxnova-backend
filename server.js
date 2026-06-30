require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authMiddleware = require("./src/middleware/authMiddleware");

// ROUTES
const authRoutes = require("./src/routes/authRoutes");
const faxRoutes = require("./src/routes/faxRoutes");
const providerRoutes = require("./src/routes/providerRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");

const app = express();

// -----------------------------
// CORS CONFIG
// -----------------------------
const allowedOrigins = [
  "https://app.faxnova.com",
  "https://admin.faxnova.com",
  "http://localhost:3000"
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith(".faxnova.com")) return callback(null, true);
    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// -----------------------------
// WEBHOOKS — NO AUTH, NO CORS BLOCK
// -----------------------------
app.use("/webhooks", webhookRoutes);

// -----------------------------
// PROTECTED API ROUTES
// -----------------------------
app.use("/api", authMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/faxes", faxRoutes);
app.use("/api/providers", providerRoutes);

// -----------------------------
// DATABASE CONNECTION
// -----------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// -----------------------------
// SERVER START
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`FaxNova backend running on port ${PORT}`));
