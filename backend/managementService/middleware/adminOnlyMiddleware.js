const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ success: false, message: "Bu işlem için admin yetkisi gerekir." });
  }

  next();
};

module.exports = adminOnlyMiddleware;
