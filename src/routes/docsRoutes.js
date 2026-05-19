// src/routes/docsRoutes.js
const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Load OpenAPI specification
const swaggerDocument = YAML.load('./openapi.yaml');

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
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
}));

// Optional: Health info at /docs/info
router.get('/info', (req, res) => {
  res.json({
    api: "FaxNova Backend",
    version: "1.1.0",
    multiProvider: true,
    providers: ["sinch", "telnyx"],
    documentation: "Swagger UI Active"
  });
});

module.exports = router;
