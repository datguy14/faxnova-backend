router.post(
  "/:id/retry",
  residencyGuard(),
  faxController.retryFax
);
