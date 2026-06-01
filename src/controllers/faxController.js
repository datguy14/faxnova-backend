// src/controllers/faxController.js
const Fax = require('../models/Fax');
const { z } = require('zod');

// Allowed providers
const PROVIDER_WHITELIST = ['sinch', 'telnyx'];

// Zod validation schema
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

exports.sendFax = async (req, res) => {
  try {
    // Validate input
    const parsed = sendFaxSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.flatten().fieldErrors,
      });
    }

    const { to, from, fileUrl, provider, coverPage } = parsed.data;

    // Create fax record
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
