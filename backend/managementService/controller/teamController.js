const teamService = require("../service/teamService");

exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeams(req.authHeader);
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.body.teamName);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.assignTeamLead = async (req, res) => {
  try {
    const team = await teamService.assignTeamLead(req.params.id, req.body.userId, req.authHeader);
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.assignTeamMembers = async (req, res) => {
  try {
    const team = await teamService.assignTeamMembers(req.params.id, req.body.userIds, req.authHeader);
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
