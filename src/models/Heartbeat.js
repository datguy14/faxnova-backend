const mongoose = require("mongoose");

const HeartbeatSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  status: { type: String, default: "ok" }, // ok | degraded | down
  mongo: { type: Boolean, default: true },
  redis: { type: Boolean, default: true },
  providers: {
    telnyx: { type: Boolean, default: true },
    sinch: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model("Heartbeat", HeartbeatSchema);
