// tests/mocks/telnyx.mock.js

const axios = require('axios');

const mockTelnyx = {
  sendFax: jest.fn().mockResolvedValue({
    data: {
      data: {
        id: 'telnyx-fax-123',
        status: 'queued'
      }
    }
  }),

  getFaxStatus: jest.fn().mockResolvedValue({
    data: {
      data: {
        id: 'telnyx-fax-123',
        status: 'delivered'
      }
    }
  })
};

// Intercept axios calls to Telnyx
axios.create = jest.fn(() => ({
  post: (...args) => mockTelnyx.sendFax(...args),
  get: (...args) => mockTelnyx.getFaxStatus(...args)
}));

module.exports = mockTelnyx;
