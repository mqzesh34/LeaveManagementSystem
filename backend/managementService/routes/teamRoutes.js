const express = require("express");
const router = express.Router();
const teamController = require("../controller/teamController");
const authMiddleware = require("../middleware/authMiddleware");
const adminOnlyMiddleware = require("../middleware/adminOnlyMiddleware");

router.get("/my", authMiddleware, teamController.getMyTeam);
router.get("/", authMiddleware, adminOnlyMiddleware, teamController.getTeams);
router.post("/", authMiddleware, adminOnlyMiddleware, teamController.createTeam);
router.put("/:id/lead", authMiddleware, adminOnlyMiddleware, teamController.assignTeamLead);
router.put("/:id/members", authMiddleware, adminOnlyMiddleware, teamController.assignTeamMembers);

module.exports = router;
