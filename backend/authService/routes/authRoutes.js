const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/verify", protect, authController.verifyToken);
router.get("/users", protect, authController.getUsers);
router.post("/users", protect, adminMiddleware, authController.createUser);
router.put("/users/:id/assignment", protect, adminMiddleware, authController.updateAssignment);
router.delete("/users/:id", protect, adminMiddleware, authController.deleteUser);

module.exports = router;
