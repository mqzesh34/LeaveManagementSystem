const notificationService = require("../service/notificationService");
const { getAuthHeaderFromRequest } = require("../service/authService");

exports.getNotifications = async (req, res) => {
  try {
    const data = await notificationService.getNotifications(req.user.id, req.authHeader);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const data = await notificationService.markAsRead(
      req.params.id,
      req.user.id,
      req.authHeader,
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    await notificationService.deleteAllNotifications(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createNotifications = async (req, res) => {
  const io = req.app.get("io");
  const authHeader = getAuthHeaderFromRequest(req);
  const rawNotifications = Array.isArray(req.body.notifications)
    ? req.body.notifications
    : req.body.notification;

  try {
    const data = await notificationService.createNotifications(rawNotifications, authHeader);

    data.forEach((notification) => {
      io.to(`user:${notification.recipientUserId}`).emit("notification", notification);
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
};
