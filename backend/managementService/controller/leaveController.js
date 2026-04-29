const leaveService = require("../service/leaveService");

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await leaveService.getMyLeaves(req.user.id);
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const leaveData = req.body;
    const newLeave = await leaveService.createLeave(userId, leaveData);
    res.json({ success: true, data: newLeave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeamView = async (req, res) => {
  try {
    const data = await leaveService.getTeamView(req.user);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const all = await leaveService.getAllLeaves();
    res.json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveLeave = async (req,res) => {
  try {
    const approvedLeave = await leaveService.approveLeave(req.params.id);
    res.json({ success: true, data: approvedLeave })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.rejectLeave = async (req,res) =>{
  try {
    const rejectedLeave = await leaveService.rejectLeave(req.params.id)
    res.json({ success: true, data: rejectedLeave })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}