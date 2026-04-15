const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/my", authMiddleware, leaveController.getMyLeaves);
router.get("/dashboard-stats", authMiddleware, leaveController.getStats);

module.exports = router;
