// tests/fax/webhook.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /fax/webhook', () => {
  it('accepts normalized Sinch webhook', async () => {
    const payload = {
      provider: 'sinch',
      eventType: 'fax.delivered',
      providerFaxId: 'prov-1',
      faxId: 'fax-1',
      status: 'delivered',
      timestamp: new Date().toISOString(),
      rawPayload: { some: 'data' },
    };

    const res = await request(app)
      .post('/fax/webhook')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects invalid webhook payload', async () => {
    const res = await request(app)
      .post('/fax/webhook')
      .send({ provider: 'sinch' }); // missing required fields

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('BAD_REQUEST');
  });
});
