// src/db.js

const mongoose = require('mongoose');

/**
 * Establish a single shared MongoDB connection.
 * This is called once from server.js at startup.
 */
async function connectToDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("❌ MONGO_URI is missing. Check your environment variables.");
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true,          // helpful during development
      serverSelectionTimeoutMS: 5000
    });

    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = {
  connectToDatabase,
  mongoose
};
