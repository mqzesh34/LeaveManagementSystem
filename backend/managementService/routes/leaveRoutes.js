const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const leaveManagerMiddleware = require("../middleware/leaveManagerMiddleware");
const adminOnlyMiddleware = require("../middleware/adminOnlyMiddleware");

router.post("/add", authMiddleware, leaveController.createLeave);
router.get("/my", authMiddleware, leaveController.getMyLeaves);
router.get("/team-view", authMiddleware, leaveController.getTeamView);
router.get("/manager-view", authMiddleware, leaveManagerMiddleware, leaveController.getStats);
router.get("/all", authMiddleware, adminOnlyMiddleware, leaveController.getAllLeaves);
router.put("/approve/:id", authMiddleware, leaveManagerMiddleware, leaveController.approveLeave);
router.put("/reject/:id", authMiddleware, leaveManagerMiddleware, leaveController.rejectLeave);

module.exports = router;
