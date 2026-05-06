const teamService = require("../service/teamService");

exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeams(req.authHeader);
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getMyTeam = async (req, res) => {
  try {
    const team = await teamService.getMyTeam(req.user);
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.body.teamName, req.body.teamLeadId, req.authHeader);
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body, req.authHeader);
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

exports.deleteTeam = async (req, res) => {
  try {
    const team = await teamService.deleteTeam(req.params.id, req.authHeader);
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
