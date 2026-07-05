// src/config/db.js

const mongoose = require("mongoose");

let isConnected = false;

/**
 * Initializes a single MongoDB connection for the entire backend.
 * Safe for workers, queues, controllers, and services.
 */
async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
}

module.exports = {
  connectDB
};
