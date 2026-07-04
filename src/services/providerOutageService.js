// providerOutageService.js
const redis = require('../config/redisClient');

const KEY = (id) => `provider:${id}:outage`;

async function getOutageState(providerId) {
  const data = await redis.hGetAll(KEY(providerId));
  return {
    failures: Number(data.failures || 0),
    successes: Number(data.successes || 0),
    state: data.state || 'healthy', // healthy | warning | outage
  };
}

async function recordFailure(providerId) {
  const current = await getOutageState(providerId);
  const failures = current.failures + 1;

  let state = current.state;
  if (failures >= 3) state = 'outage';
  else if (failures >= 1) state = 'warning';

  await redis.hSet(KEY(providerId), {
    failures,
    successes: current.successes,
    state,
  });

  return { failures, state };
}

async function recordSuccess(providerId) {
  const current = await getOutageState(providerId);
  const successes = current.successes + 1;

  let state = current.state;
  if (successes >= 2) state = 'healthy';

  await redis.hSet(KEY(providerId), {
    failures: current.failures,
    successes,
    state,
  });

  return { successes, state };
}

module.exports = {
  recordFailure,
  recordSuccess,
  getOutageState,
};
