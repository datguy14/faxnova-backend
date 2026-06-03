const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

// Correct path: openapi.yaml is in project root
const openapiPath = path.join(process.cwd(), "openapi.yaml");

// Load the OpenAPI spec
const swaggerDocument = YAML.load(openapiPath);

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

router.get("/info", (req, res) => {
  res.json({
    api: "FaxNova Backend",
    version: "1.1.0",
    docs: "Swagger UI Active",
    specPath: openapiPath
  });
});

module.exports = router;
