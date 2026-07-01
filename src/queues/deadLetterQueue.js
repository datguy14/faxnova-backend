// src/routes/deadLetterRoutes.js

const express = require("express");
const router = express.Router();

const deadLetterQueue = require("../queues/deadLetterQueue");
const webhookQueue = require("../queues/webhookQueue");

// List DLQ events
router.get("/", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);
  res.json(jobs.map((j) => j.data));
});

// Requeue DLQ event
router.post("/requeue/:eventId", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);

  const job = jobs.find((j) => j.data.event.externalEventId === req.params.eventId);
  if (!job) return res.status(404).json({ error: "Event not found" });

  await webhookQueue.add("processWebhookEvent", job.data.event);
  await job.remove();

  res.json({ ok: true, requeued: req.params.eventId });
});

// Discard DLQ event
router.delete("/:eventId", async (req, res) => {
  const jobs = await deadLetterQueue.getJobs(["waiting", "failed"]);

  const job = jobs.find((j) => j.data.event.externalEventId === req.params.eventId);
  if (!job) return res.status(404).json({ error: "Event not found" });

  await job.remove();
  res.json({ ok: true, discarded: req.params.eventId });
});

module.exports = router;
