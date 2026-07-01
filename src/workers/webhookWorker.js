// src/workers/webhookWorker.js

await OutboundFax.findByIdAndUpdate(
  event.faxId,   // now an ObjectId
  {
    status: event.status,
    providerStatus: event.providerStatus,
    completedAt: new Date()
  }
);
