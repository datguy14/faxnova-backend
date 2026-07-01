// src/routes/deadLetterRoutes.js

const express = require("express");
const router = express.Router();

const deadLetterQueue = require("../queues/deadLetterQueue");
const webhookQueue = require("../queues/webhookQueue");

// List DLQ jobs
router.get("/", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);
  res.json(jobs.map((j) => j.data));
});

// Requeue DLQ job
router.post("/requeue/:eventId", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);
  const job = jobs.find((j) => j.data.event.externalEventId === req.params.eventId);

  if (!job) return res.status(404).json({ error: "Event not found" });

  await webhookQueue.add("processWebhookEvent", job.data.event, {
    priority: 1, // escalate
  });

  await job.remove();
  res.json({ ok: true });
});

// Discard DLQ job
router.delete("/:eventId", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);
  const job = jobs.find((j) => j.data.event.externalEventId === req.params.eventId);

  if (!job) return res.status(404).json({ error: "Event not found" });

  await job.remove();
  res.json({ ok: true });
});

module.exports = router;
