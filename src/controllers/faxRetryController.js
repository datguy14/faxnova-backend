const { retryFax } = require('../services/faxRetryService');

exports.retryFaxController = async (req, res) => {
  try {
    const { faxId } = req.params;

    if (!faxId) {
      return res.status(400).json({ error: 'faxId is required' });
    }

    const result = await retryFax(faxId);

    return res.status(200).json({
      message: 'Fax retry initiated successfully',
      data: result
    });
  } catch (error) {
    console.error('Retry fax error:', error.response?.data || error.message);

    return res.status(500).json({
      error: 'Failed to retry fax',
      details: error.response?.data || error.message
    });
  }
};
