module.exports = (req, res, next) => {
  const { to, fileUrl } = req.body;

  const missing = [];
  if (!to) missing.push('to');
  if (!fileUrl) missing.push('fileUrl');

  if (missing.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missing
    });
  }

  next();
};
