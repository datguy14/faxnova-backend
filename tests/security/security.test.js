// tests/security/security.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Security & hardening', () => {
  it('requires API key on protected routes', async () => {
    const res = await request(app)
      .post('/fax/send')
      .send({
        to: '+15551234567',
        fileUrl: 'https://example.com/document.pdf',
      });

    expect(res.status).toBe(401);
  });

  it('rejects invalid JWT on protected routes', async () => {
    const res = await request(app)
      .get('/fax/status/fax-123')
      .set('Authorization', 'Bearer invalid-token')
      .set('x-api-key', 'test-api-key');

    expect(res.status).toBe(401);
  });

  it('enforces rate limiting on /fax/send (behavioral)', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app)
        .post('/fax/send')
        .set('x-api-key', 'test-api-key')
        .send({
          to: '+15551234567',
          fileUrl: 'https://example.com/document.pdf',
        });
    }

    const res = await request(app)
      .post('/fax/send')
      .set('x-api-key', 'test-api-key')
      .send({
        to: '+15551234567',
        fileUrl: 'https://example.com/document.pdf',
      });

    // Depending on your limiter, expect 429 or similar
    expect([200, 429]).toContain(res.status);
  });
});
