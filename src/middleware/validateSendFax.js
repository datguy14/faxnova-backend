module.exports = (req, res, next) => {
  const { to, fileUrl } = req.body;

  if (!to || !fileUrl) {
    return res.status(400).json({
      success: false,
      message: 'Missing "to" or "fileUrl"'
    });
  }

  next();
};
