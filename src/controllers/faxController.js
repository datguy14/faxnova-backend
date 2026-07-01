// src/controllers/faxController.js

const FaxNovaError = require("../errors/FaxNovaError");
const { createFaxSchema } = require("../schemas/faxSchemas");
const faxService = require("../services/faxService");

exports.createFax = async (req, res, next) => {
  try {
    const data = createFaxSchema.parse(req.body);

    const fax = await faxService.createFaxJob(data);
    res.json(fax);

  } catch (err) {
    next(new FaxNovaError(err.errors?.[0]?.message || "Invalid fax payload", 400));
  }
};
