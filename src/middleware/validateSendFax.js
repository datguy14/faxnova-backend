module.exports = (req, res, next) => {
  const { to, from, fileUrl } = req.body;

  const missing = [];
  if (!to) missing.push('to');
  if (!from) missing.push('from');
  if (!fileUrl) missing.push('fileUrl');

  if (missing.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missing
    });
  }

  next();
};
