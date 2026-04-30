const express = require("express");
const router = express.Router();
const leaveController = require("../controller/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const leaveManagerMiddleware = require("../middleware/leaveManagerMiddleware");

router.post("/add", authMiddleware, leaveController.createLeave);
router.get("/my", authMiddleware, leaveController.getMyLeaves);
router.get("/team-view", authMiddleware, leaveController.getTeamView);
router.get("/admin-view", authMiddleware, leaveManagerMiddleware, leaveController.getStats);
router.put("/approve/:id", authMiddleware, leaveManagerMiddleware, leaveController.approveLeave);
router.put("/reject/:id", authMiddleware, leaveManagerMiddleware, leaveController.rejectLeave);

module.exports = router;
