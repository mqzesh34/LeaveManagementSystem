const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/verify", protect, authController.verifyToken);
router.get("/users", authController.getUsers);

module.exports = router;
