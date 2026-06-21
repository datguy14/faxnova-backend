// tests/auth/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Auth flows', () => {
  it('registers a user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'StrongPass123!',
        name: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();
  });

  it('logs in and returns JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'StrongPass123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'WrongPass',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
