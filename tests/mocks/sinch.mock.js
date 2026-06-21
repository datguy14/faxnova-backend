// tests/mocks/sinch.mock.js

const axios = require('axios');

const mockSinch = {
  sendFax: jest.fn().mockResolvedValue({
    data: {
      id: 'sinch-fax-123',
      status: 'queued'
    }
  }),

  getFaxStatus: jest.fn().mockResolvedValue({
    data: {
      id: 'sinch-fax-123',
      status: 'delivered'
    }
  })
};

// Intercept axios calls to Sinch
axios.create = jest.fn(() => ({
  post: (...args) => mockSinch.sendFax(...args),
  get: (...args) => mockSinch.getFaxStatus(...args)
}));

module.exports = mockSinch;
