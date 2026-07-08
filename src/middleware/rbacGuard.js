const permissions = require("../rbac/permissions");
const auditService = require("../services/auditService");

module.exports = function rbacGuard(permissionKey) {
  return function (req, res, next) {
    const role = req.adminRole;

    if (!permissions[role] || !permissions[role][permissionKey]) {
      auditService.logEvent({
        type: "ADMIN_RBAC_DENIED",
        details: {
          adminId: req.adminId,
          role,
          permissionKey
        }
      });

      return res.status(403).json({
        error: "Forbidden: insufficient permissions"
      });
    }

    next();
  };
};
