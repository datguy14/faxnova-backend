// src/routes/docsRoutes.js
const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Absolute, Render‑safe path to openapi.yaml
const openapiPath = path.join(process.cwd(), "src", "openapi.yaml");

// Load the OpenAPI spec
const swaggerDocument = YAML.load(openapiPath);

// Serve Swagger UI
router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 20px }
    `,
    customSiteTitle: "FaxNova API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  })
);

// Optional: health/info endpoint for docs
router.get("/info", (req, res) => {
  res.json({
    api: "FaxNova Backend",
    version: "1.1.0",
    docs: "Swagger UI Active",
    specPath: openapiPath
  });
});

module.exports = router;
