// src/lib/mongo.js
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 20,  // max concurrent connections
  minPoolSize: 5    // keep a warm pool
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected with pooling");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error", err);
});

module.exports = mongoose;
