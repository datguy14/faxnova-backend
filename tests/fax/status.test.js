// tests/fax/status.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /fax/status/:id', () => {
  const apiKey = 'test-api-key';

  it('returns fax status when found', async () => {
    // Seed DB or mock repository to contain faxId "fax-123"
    // e.g., FaxRepo.create({ id: 'fax-123', status: 'delivered', provider: 'telnyx' });

    const res = await request(app)
      .get('/fax/status/fax-123')
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.faxId).toBe('fax-123');
    expect(res.body.status).toBeDefined();
  });

  it('returns 404 when fax not found', async () => {
    const res = await request(app)
      .get('/fax/status/does-not-exist')
      .set('x-api-key', apiKey);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
