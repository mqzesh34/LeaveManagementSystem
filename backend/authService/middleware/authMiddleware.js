const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer") 
    ? req.headers.authorization.split(" ")[1] 
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Token bulunamadı, giriş yapmalısın." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: "Yetkisiz erişim, token geçersiz!" });
  }
};

module.exports = { protect };
