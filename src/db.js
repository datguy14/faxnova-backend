// src/db.js
const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(uri, {
    autoIndex: false
  });

  console.log("MongoDB connected");
}

module.exports = {
  mongoose,
  connectDB
};
