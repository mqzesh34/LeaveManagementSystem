const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token bulunamadı." });
  }

  try {
    const response = await fetch("http://localhost:5005/api/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token.startsWith("Bearer") ? token : `Bearer ${token}`
      },
    });

    const result = await response.json();
    if (result.success) {
      req.user = result.user;
      next();
    } else {
      res.status(401).json({ success: false });
    }
  } catch (error) {
    res.status(401).json({ success: false });
  }
};

module.exports = authMiddleware;
