module.exports = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  const status = err.status || 500;

  res.status(status).json({
    error: err.message || 'Internal server error',
    details: err.details || null
  });
};
