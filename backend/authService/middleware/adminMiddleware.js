const User = require("../models/user");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Bu işlem için admin yetkisi gerekir." });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Yetki kontrolü yapılamadı." });
  }
};

module.exports = adminMiddleware;
