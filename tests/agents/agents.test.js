// tests/agents/agents.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Agents endpoints', () => {
  const apiKey = 'test-api-key';

  it('Routing Agent returns provider + residencyZone', async () => {
    const res = await request(app)
      .post('/agents/route')
      .set('x-api-key', apiKey)
      .send({
        to: '+15551234567',
        countryCode: 'US',
        tier: 'enterprise',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.provider).toBeDefined();
    expect(res.body.residencyZone).toBeDefined();
  });

  it('Troubleshooting Agent returns recommendations', async () => {
    const res = await request(app)
      .post('/agents/troubleshoot')
      .set('x-api-key', apiKey)
      .send({
        faxId: 'fax-123',
        provider: 'telnyx',
        errorCode: 'TIMEOUT',
        context: 'Provider timeout',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('Audit Agent returns findings', async () => {
    const res = await request(app)
      .post('/agents/audit-code')
      .set('x-api-key', apiKey)
      .send({
        repoUrl: 'https://github.com/datguy14/faxnova-backend',
        branch: 'main',
        context: 'pre-acquisition audit',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.findings)).toBe(true);
  });
});
