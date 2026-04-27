const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/my", authMiddleware, leaveController.getMyLeaves);
router.get("/team-view", authMiddleware, leaveController.getTeamView);
router.get("/admin-view", authMiddleware, adminMiddleware, leaveController.getStats);
router.put("/approve/:id", authMiddleware, adminMiddleware, leaveController.approveLeave);
router.put("/reject/:id", authMiddleware, adminMiddleware, leaveController.rejectLeave);

module.exports = router;
