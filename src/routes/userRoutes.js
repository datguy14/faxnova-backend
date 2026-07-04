// src/routes/userRoutes.js

const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// All user routes require authentication
router.use(authMiddleware);

// List users for a tenant
router.get("/:tenantId", userController.listUsers);

// Create a new user
router.post("/:tenantId", userController.createUser);

// Update a user
router.put("/:tenantId/:userId", userController.updateUser);

// Disable or enable a user
router.put("/:tenantId/:userId/status", userController.updateUserStatus);

// Delete a user
router.delete("/:tenantId/:userId", userController.deleteUser);

module.exports = router;
