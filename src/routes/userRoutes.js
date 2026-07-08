// src/routes/userRoutes.js — Unified Fax Architecture

const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// All user routes already protected by apiKeyGuard in app.js

// List users for the authenticated tenant
router.get("/", userController.listUsers);

// Create a new user
router.post("/", userController.createUser);

// Update a user
router.put("/:userId", userController.updateUser);

// Disable or enable a user
router.put("/:userId/status", userController.updateUserStatus);

// Delete a user
router.delete("/:userId", userController.deleteUser);

module.exports = router;
