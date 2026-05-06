const normalizeAuthHeader = (token) =>
  token?.startsWith("Bearer") ? token : `Bearer ${token}`;

const getUserId = (user) => String(user?._id ?? user?.id ?? "");

const getAuthHeaderFromRequest = (req) => {
  const token = req.headers.authorization || req.cookies?.token;
  return token ? normalizeAuthHeader(token) : null;
};

const parseCookieHeader = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (!key) return cookies;
    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});

const getAuthHeaderFromSocket = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return normalizeAuthHeader(authToken);

  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  return cookies.token ? normalizeAuthHeader(cookies.token) : null;
};

const verifyToken = async (authHeader) => {
  if (!authHeader) return null;

  const response = await fetch(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  });
  const result = await response.json();
  return result.success ? result.user : null;
};

const fetchUsers = async (authHeader) => {
  if (!authHeader) return [];

  const response = await fetch(`${process.env.AUTH_SERVICE_URL}/api/auth/users`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  });
  const result = await response.json();
  return result.success ? result.data : [];
};

module.exports = {
  fetchUsers,
  getAuthHeaderFromRequest,
  getAuthHeaderFromSocket,
  getUserId,
  verifyToken,
};
