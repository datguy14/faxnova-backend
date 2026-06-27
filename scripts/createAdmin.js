const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AdminUser = require("../src/models/AdminUser");

require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: node scripts/createAdmin.js <email> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await AdminUser.create({ email, passwordHash });

  console.log("Admin created:", admin.email);
  process.exit(0);
}

run();
