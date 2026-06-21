// tests/fax/send.test.js
const request = require('supertest');
const app = require('../../src/app'); // your Express app
const nock = require('nock');

describe('POST /fax/send', () => {
  const apiKey = 'test-api-key';

  beforeEach(() => {
    nock.cleanAll();
  });

  it('queues fax with valid payload', async () => {
    // Mock provider (e.g., Telnyx)
    nock('https://api.telnyx.com')
      .post(/faxes/)
      .reply(200, { id: 'prov-123', status: 'queued' });

    const res = await request(app)
      .post('/fax/send')
      .set('x-api-key', apiKey)
      .send({
        to: '+15551234567',
        fileUrl: 'https://example.com/document.pdf',
        provider: 'telnyx',
        correlationId: 'corr-1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.faxId).toBeDefined();
    expect(res.body.provider).toBe('telnyx');
    expect(res.body.status).toBe('queued');
  });

  it('rejects invalid payload', async () => {
    const res = await request(app)
      .post('/fax/send')
      .set('x-api-key', apiKey)
      .send({ to: '+15551234567' }); // missing fileUrl

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('blocks SSRF / invalid fileUrl', async () => {
    const res = await request(app)
      .post('/fax/send')
      .set('x-api-key', apiKey)
      .send({
        to: '+15551234567',
        fileUrl: 'http://127.0.0.1/internal.pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });
});
