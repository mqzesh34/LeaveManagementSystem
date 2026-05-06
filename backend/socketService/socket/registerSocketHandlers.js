const { socketAuthMiddleware } = require("../middleware/authMiddleware");

const registerSocketHandlers = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.user;

    if (user?.id) socket.join(`user:${user.id}`);

    if (user?.role === "admin") {
      socket.join("admins");
    }

    if (user?.role === "team_lead" && user?.teamId) {
      socket.join(`team-leads:${user.teamId}`);
    }

    socket.emit("notification:ready", {
      userId: user?.id,
      teamId: user?.teamId,
      role: user?.role,
    });
  });
};

module.exports = registerSocketHandlers;
