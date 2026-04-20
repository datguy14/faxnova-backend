const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'fax-events.log');

async function getFaxEventHistory(req, res, next) {
  try {
    const { faxId } = req.params;

    if (!faxId) {
      return res.status(400).json({
        success: false,
        error: 'faxId is required',
      });
    }

    if (!fs.existsSync(LOG_FILE)) {
      return res.status(200).json({
        success: true,
        faxId,
        events: [],
      });
    }

    const events = fs
      .readFileSync(LOG_FILE, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.faxId === faxId);

    return res.status(200).json({
      success: true,
      faxId,
      events,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFaxEventHistory,
};
