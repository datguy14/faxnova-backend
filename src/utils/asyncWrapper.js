// src/utils/asyncWrapper.js — Unified Fax Architecture (CommonJS Only)

module.exports = function asyncWrapper(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
