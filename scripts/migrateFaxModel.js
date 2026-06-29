// scripts/migrateFaxModel.js
// Run with: node scripts/migrateFaxModel.js

const mongoose = require("mongoose");
require("dotenv").config();

const Fax = require("../src/models/Fax");
const OutboundFax = require("../src/models/OutboundFax");

async function migrate() {
  try {
    console.log("🚀 Starting Fax.js → OutboundFax migration...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    const legacyFaxes = await Fax.find({});
    console.log(`📦 Found ${legacyFaxes.length} legacy Fax records`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const legacy of legacyFaxes) {
      const exists = await OutboundFax.findOne({ faxId: legacy.faxId });

      if (exists) {
        console.log(`⚠️ Skipping already-migrated faxId=${legacy.faxId}`);
        skippedCount++;
        continue;
      }

      await OutboundFax.create({
        faxId: legacy.faxId,
        tenantId: legacy.tenantId,
        to: legacy.to,
        from: legacy.from,
        pages: legacy.pages,
        documentUrl: legacy.documentUrl,
        provider: legacy.provider,
        providerMessageId: legacy.providerMessageId,
        providerStatus: legacy.providerStatus,
        region: legacy.region || "us",
        status: legacy.status || "queued",
        attempts: legacy.attempts || 0,
        createdAt: legacy.createdAt,
        updatedAt: legacy.updatedAt
      });

      console.log(`✅ Migrated faxId=${legacy.faxId}`);
      migratedCount++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped:  ${skippedCount}`);

    console.log("\n🧨 Dropping legacy Fax collection...");
    await Fax.collection.drop();
    console.log("💥 Fax collection removed.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
