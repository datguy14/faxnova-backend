// src/controllers/auditViewerController.js
const fs = require('fs').promises;
const path = require('path');
const audit = require('../services/auditService');

const LOG_FILE = path.join(__dirname, '../../logs/fax-audit.log');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const correlationId = req.correlationId;

    // 🔐 Require secure API key
    const providedKey = req.headers['x-audit-key'];
    if (!providedKey || providedKey !== process.env.FAXNOVA_API_KEY) {
      // Log unauthorized access attempt
      await audit.logFaxEvent({
        eventType: 'AUDIT_VIEWER_UNAUTHORIZED',
        status: 'DENIED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId,
        success: false
      });

      return next({
        status: 403,
        message: 'Forbidden: Invalid audit viewer key',
        correlationId
      });
    }

    // Optional filters
    const { tenantId, faxId, eventType, limit = 100 } = req.query;

    // Read log file
    const raw = await fs.readFile(LOG_FILE, 'utf8');
    const lines = raw.trim().split('\n');

    // Parse JSON lines
    let events = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Apply filters
    if (tenantId) events = events.filter(e => e.tenantId === tenantId);
    if (faxId) events = events.filter(e => e.faxId === faxId);
    if (eventType) events = events.filter(e => e.eventType === eventType);

    // Limit results
    const limited = events.slice(-Math.abs(limit));

    // 🔥 AUDIT: Viewer accessed logs
    await audit.logFaxEvent({
      eventType: 'AUDIT_VIEWER_ACCESSED',
      status: 'SUCCESS',
      details: { count: limited.length, filters: req.query },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId,
      success: true
    });

    return res.status(200).json({
      success: true,
      count: limited.length,
      events: limited,
      correlationId
    });

  } catch (error) {
    next({
      status: 500,
      message: error.message,
      correlationId: req.correlationId
    });
  }
};
