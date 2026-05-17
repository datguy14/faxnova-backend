const {
  sendFaxLimiter,
  sendFaxHourlyLimiter,
  statusLimiter
} = require('../middleware/rateLimit');

router.post(
  '/send',
  sendFaxLimiter,
  sendFaxHourlyLimiter,
  faxController.sendFax
);

router.get(
  '/status/:id',
  statusLimiter,
  faxController.getFaxStatus
);
