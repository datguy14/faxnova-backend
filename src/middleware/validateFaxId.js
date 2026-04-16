module.exports = (req, res, next) => {
  const { faxId } = req.params;

  if (!faxId || typeof faxId !== 'string' || faxId.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid faxId',
      details: 'faxId must be a non-empty string'
    });
  }

  next();
};
