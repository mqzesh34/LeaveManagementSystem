const serviceTokenMiddleware = (req, res, next) => {
  const expectedToken = process.env.SOCKET_SERVICE_TOKEN;
  if (!expectedToken) return next();

  if (req.headers["x-service-token"] !== expectedToken) {
    return res.status(401).json({ success: false, message: "Yetkisiz servis isteği." });
  }

  next();
};

module.exports = serviceTokenMiddleware;
