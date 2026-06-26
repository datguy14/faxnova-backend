// src/server.js
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

// Connect to database
connectDB();

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
