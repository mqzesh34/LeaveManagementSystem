const {
  getAuthHeaderFromRequest,
  getAuthHeaderFromSocket,
  verifyToken,
} = require("../service/authService");

const authMiddleware = async (req, res, next) => {
  const authHeader = getAuthHeaderFromRequest(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Token bulunamadı." });
  }

  try {
    const user = await verifyToken(authHeader);
    if (!user) {
      return res.status(401).json({ success: false, message: "Geçersiz token." });
    }

    req.user = user;
    req.authHeader = authHeader;
    next();
  } catch (_error) {
    res.status(401).json({ success: false, message: "Doğrulama yapılamadı." });
  }
};

const socketAuthMiddleware = async (socket, next) => {
  const authHeader = getAuthHeaderFromSocket(socket);
  if (!authHeader) return next(new Error("Token bulunamadı."));

  try {
    const user = await verifyToken(authHeader);
    if (!user) return next(new Error("Geçersiz token."));

    socket.user = user;
    socket.authHeader = authHeader;
    next();
  } catch (_error) {
    next(new Error("Socket doğrulaması yapılamadı."));
  }
};

module.exports = {
  authMiddleware,
  socketAuthMiddleware,
};
