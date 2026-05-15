// src/controllers/faxEventHistoryController.js
const db = require('../db');

exports.getFaxEventHistory = async (req, res, next) => {
  try {
    const { id: faxId } = req.params;

    if (!faxId) {
      return res.status(400).json({
        success: false,
        error: "faxId is required"
      });
    }

    const query = `
      SELECT fax_id, status, direction, metadata, received_at, correlation_id
      FROM fax_events
      WHERE fax_id = $1
      ORDER BY received_at DESC;
    `;

    const { rows } = await db.query(query, [faxId]);

    return res.status(200).json({
      success: true,
      faxId,
      events: rows
    });

  } catch (err) {
    next(err);
  }
};
