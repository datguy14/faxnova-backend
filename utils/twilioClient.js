const Phaxio = require('phaxio');

const phaxio = new Phaxio(
  process.env.PHAXIO_API_KEY,
  process.env.PHAXIO_API_SECRET
);

module.exports = phaxio;
