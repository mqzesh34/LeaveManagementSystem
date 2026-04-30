const leaveManagerMiddleware = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();

  if (!req.user || !["admin", "team_lead"].includes(role)) {
    return res.status(403).json({ success: false, message: "Bu işlem için yetkiniz yok." });
  }

  next();
};

module.exports = leaveManagerMiddleware;
