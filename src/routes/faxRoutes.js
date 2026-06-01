// src/routes/faxRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const agentAuth = require('../middleware/agentAuth');
const Fax = require('../models/Fax');

// 🔐 Protect all fax routes
router.use(agentAuth);

// Proxy‑safe rate limiter for fax sending
const faxSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});

// Zod validation schema
const sendFaxSchema = z.object({
  to: z.string().min(10, 'Recipient fax number is required'),
  fileUrl: z.string().url('fileUrl must be a valid URL'),
  coverPage: z.string().optional(),
});

/* ============================================================
   SEND FAX
============================================================ */
router.post('/send', faxSendLimiter, async (req, res) => {
  try {
    const parsed = sendFaxSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const { to, fileUrl, coverPage } = parsed.data;

    const fax = await Fax.create({
      userId: req.user._id,
      to,
      fileUrl,
      coverPage: coverPage || null,
      status: 'queued',
    });

    // TODO: enqueue provider send job here

    res.json({ success: true, fax });
  } catch (err) {
    console.error('Send fax error:', err);
    res.status(500).json({ success: false, error: 'Failed to send fax' });
  }
});

/* ============================================================
   GET FAX BY ID
============================================================ */
router.get('/:id', async (req, res) => {
  try {
    const fax = await Fax.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!fax) {
      return res.status(404).json({ success: false, error: 'Fax not found' });
    }

    res.json({ success: true, fax });
  } catch (err) {
    console.error('Get fax error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch fax' });
  }
});

/* ============================================================
   LIST USER FAXES
============================================================ */
router.get('/', async (req, res) => {
  try {
    const faxes = await Fax.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, faxes });
  } catch (err) {
    console.error('List fax error:', err);
    res.status(500).json({ success: false, error: 'Failed to list faxes' });
  }
});

module.exports = router;
