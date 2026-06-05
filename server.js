import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/db.js";
import faxRoutes from "./src/routes/faxRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "FaxNova backend is running" });
});

// Routes
app.use("/fax", faxRoutes);
app.use("/webhook", webhookRoutes);

// Database
connectDB();

// Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
