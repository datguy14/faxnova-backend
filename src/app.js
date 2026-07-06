// src/app.js — CommonJS Strict‑Mode Version

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = [
        "https://app.faxnova.com",
        "https://admin.faxnova.com",
        "http://localhost:3000"
      ];
      if (allowed.includes(origin) || origin.endsWith(".faxnova.com")) {
        return cb(null, true);
      }
      cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));

module.exports = app;
