const express = require("express");

const router = express.Router();

/**
 * FaxNova v1 API Documentation
 * Returns a structured overview of all public + protected endpoints.
 */
router.get("/", (req, res) => {
  res.json({
    name: "FaxNova API",
    version: "v1",
    docs: {
      health: {
        GET: "/",
        description: "Health check for FaxNova backend"
      },
      fax: {
        POST: "/fax/send",
        GET: "/fax/:faxId/status",
        POST_retry: "/fax/:faxId/retry",
        description: "Outbound fax operations"
      },
      inbound: {
        POST: "/webhook/inbound",
        description: "Provider → FaxNova inbound fax webhook"
      },
      providers: {
        GET: "/providers",
        GET_status: "/providers/status",
        GET_performance: "/providers/performance",
        GET_outages: "/providers/outages",
        description: "Provider routing + analytics"
      },
      analytics: {
        GET: "/analytics/usage",
        GET_fax_volume: "/analytics/fax-volume",
        description: "Tenant analytics + usage metrics"
      }
    },
    auth: {
      type: "API Key",
      header: "Authorization: Bearer <API_KEY>",
      tiers: ["basic", "pro", "enterprise"]
    },
    residency: {
      header: "x-faxnova-zone",
      description: "Controls data residency + sovereignty routing"
    }
  });
});

module.exports = router;
