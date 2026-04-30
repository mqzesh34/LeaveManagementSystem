const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token bulunamadı." });
  }

  const authUrl = process.env.AUTH_SERVICE_URL;
  try {
    const response = await fetch(`${authUrl}/api/auth/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token.startsWith("Bearer") ? token : `Bearer ${token}`
      },
    });

    const result = await response.json();
    if (result.success) {
      req.user = result.user;
      req.authHeader = token.startsWith("Bearer") ? token : `Bearer ${token}`;
      next();
    } else {
      res.status(401).json({ success: false });
    }
  } catch (error) {
    res.status(401).json({ success: false });
  }
};

module.exports = authMiddleware;
