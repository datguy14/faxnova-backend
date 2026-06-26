// inside module.exports in faxController.js

const { retryFaxSchema } = require("../validation/retryFaxSchema");
const retryFaxService = require("../services/retryFaxService");

async retryFax(req, res, next) {
  try {
    const parsed = retryFaxSchema.parse({ faxId: req.params.id });

    // TODO: Replace with DB lookup
    const originalPayload = null;

    if (!originalPayload) {
      throw new FaxNovaError("Original fax payload not found", {
        code: "FAX_NOT_FOUND",
        details: { faxId: parsed.faxId }
      });
    }

    const result = await retryFaxService.retryFax({
      faxId: parsed.faxId,
      originalPayload
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
