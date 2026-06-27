const jwt = require("jsonwebtoken");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new FaxNovaError("Missing admin token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      throw new FaxNovaError("Unauthorized", { code: "NOT_ADMIN" });
    }

    req.adminId = decoded.adminId;
    next();
  } catch (err) {
    next(err);
  }
};
