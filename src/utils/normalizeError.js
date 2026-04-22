module.exports = function normalizeError(err) {
  return {
    message: err.message || 'Unexpected error',
    type: err.type || 'InternalError',
    status: err.status || 500,
    details: err.details || null,
  };
};
