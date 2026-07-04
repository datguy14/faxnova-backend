// providerPerformanceService.js
const redis = require('../config/redisClient');

const KEY = (id) => `provider:${id}:performance`;

async function getScore(providerId) {
  const data = await redis.hGetAll(KEY(providerId));
  return Number(data.score || 0);
}

async function applySuccessBoost(providerId) {
  const current = await getScore(providerId);
  const updated = current + 1; // small positive reinforcement
  await redis.hSet(KEY(providerId), { score: updated });
  return updated;
}

async function applyFailurePenalty(providerId) {
  const current = await getScore(providerId);
  const updated = Math.max(current - 2, -10); // stronger penalty, floor at -10
  await redis.hSet(KEY(providerId), { score: updated });
  return updated;
}

module.exports = {
  getScore,
  applySuccessBoost,
  applyFailurePenalty,
};
