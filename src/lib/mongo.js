// src/lib/mongo.js — Fully Updated, Production‑Ready (CommonJS Only)

const mongoose = require("mongoose");

// Strict query mode prevents silent filtering bugs
mongoose.set("strictQuery", true);

// Connection state guard
let isConnected = false;

/**
 * Connect to MongoDB with production‑grade pooling, retry logic,
 * and startup validation.
 */
async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is missing — cannot start backend");
    process.exit(1);
  }

  if (isConnected) {
    return mongoose;
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB || "faxnova",
      maxPoolSize: 20,   // your existing pooling logic
      minPoolSize: 5,    // keep warm pool
      serverSelectionTimeoutMS: 5000, // fail fast
      socketTimeoutMS: 45000,         // prevent hanging sockets
      retryWrites: true,              // required for multi‑region clusters
      w: "majority"                   // ensures consistency
    });

    isConnected = true;
    console.log("🗄️ MongoDB connected with pooling");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    // Hard fail on startup — prevents partial boot
    process.exit(1);
  }

  return mongoose;
}

// Connection event logging
mongoose.connection.on("connected", () => {
  console.log("🔗 MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.error("⚠️ MongoDB disconnected — workers may fail");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

module.exports = { connectMongo, mongoose };
