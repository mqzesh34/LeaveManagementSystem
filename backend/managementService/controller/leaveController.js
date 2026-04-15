const leaveService = require("../service/leaveService");

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await leaveService.getMyLeaves(req.user.id);
    res.json({ success: true, data: leaves });
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
