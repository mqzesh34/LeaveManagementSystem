const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ success: false, message: "Bu işlem için yetkiniz yok." });
  }
  next();
};

module.exports = adminMiddleware;
