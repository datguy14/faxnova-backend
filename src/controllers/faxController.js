// src/controllers/faxController.js
const { z } = require('zod');
const Fax = require('../models/Fax');

const PROVIDER_WHITELIST = ['sinch', 'telnyx'];

/* ============================================================
   SCHEMAS
============================================================ */

const sendFaxSchema = z.object({
  to: z
    .string()
    .min(10, 'Recipient fax number is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid fax number format'),
  from: z
    .string()
    .min(10, 'Sender fax number is required')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid fax number format'),
  fileUrl: z
    .string()
    .url('fileUrl must be a valid URL')
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('http://'),
      'fileUrl must be HTTP/HTTPS'
    ),
  provider: z
    .string()
    .toLowerCase()
    .refine((p) => PROVIDER_WHITELIST.includes(p), 'Invalid provider'),
  coverPage: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1, 'Fax ID is required'),
});

const listQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .refine((v) => v > 0 && v <= 200, 'limit must be between 1 and 200'),
  status: z
    .string()
    .optional()
    .toLowerCase()
    .refine(
      (s) => !s || ['queued', 'sending', 'delivered', 'failed', 'canceled'].includes(s),
      'Invalid status filter'
    ),
});

const retrySchema = z.object({
  id: z.string().min(1, 'Fax ID is required'),
});

/* ============================================================
   SEND FAX
============================================================ */

exports.sendFax = async (req, res) => {
  try {
    const parsed = sendFaxSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const { to, from, fileUrl, provider, coverPage } = parsed.data;

    const fax = await Fax.create({
      userId: req.user._id,
      to,
      from,
      fileUrl,
      provider,
      coverPage: coverPage || null,
      status: 'queued',
    });

    // TODO: enqueue provider send job here

    res.json({ success: true, fax });
  } catch (err) {
    console.error('Send fax controller error:', err);
    res.status(500).json({ success: false, error: 'Failed to send fax' });
  }
};

/* ============================================================
   GET FAX BY ID
============================================================ */

exports.getFaxById = async (req, res) => {
  try {
    const parsed = idParamSchema.safeParse({ id: req.params.id });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const fax = await Fax.findOne({
      _id: parsed.data.id,
      userId: req.user._id,
    });

    if (!fax) {
      return res.status(404).json({ success: false, error: 'Fax not found' });
    }

    res.json({ success: true, fax });
  } catch (err) {
    console.error('Get fax controller error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch fax' });
  }
};

/* ============================================================
   LIST FAXES
============================================================ */

exports.listFaxes = async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const { limit, status } = parsed.data;

    const query = { userId: req.user._id };
    if (status) query.status = status;

    const faxes = await Fax.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, faxes });
  } catch (err) {
    console.error('List faxes controller error:', err);
    res.status(500).json({ success: false, error: 'Failed to list faxes' });
  }
};

/* ============================================================
   RETRY FAX
============================================================ */

exports.retryFax = async (req, res) => {
  try {
    const parsed = retrySchema.safeParse({ id: req.params.id });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const fax = await Fax.findOne({
      _id: parsed.data.id,
      userId: req.user._id,
    });

    if (!fax) {
      return res.status(404).json({ success: false, error: 'Fax not found' });
    }

    if (!['failed', 'canceled'].includes(fax.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only failed or canceled faxes can be retried',
      });
    }

    fax.status = 'queued';
    await fax.save();

    // TODO: enqueue provider retry job here

    res.json({ success: true, fax });
  } catch (err) {
    console.error('Retry fax controller error:', err);
    res.status(500).json({ success: false, error: 'Failed to retry fax' });
  }
};

/* ============================================================
   DELETE FAX
============================================================ */

exports.deleteFax = async (req, res) => {
  try {
    const parsed = idParamSchema.safeParse({ id: req.params.id });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const fax = await Fax.findOneAndDelete({
      _id: parsed.data.id,
      userId: req.user._id,
    });

    if (!fax) {
      return res.status(404).json({ success: false, error: 'Fax not found' });
    }

    res.json({ success: true, deleted: true });
  } catch (err) {
    console.error('Delete fax controller error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete fax' });
  }
};
