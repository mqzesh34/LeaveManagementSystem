const Notification = require("../models/Notification");
const { fetchUsers, getUserId } = require("./authService");

const enrichNotification = (notification, users) => {
  const plainNotification = notification.toObject ? notification.toObject() : notification;
  const actor = users.find((user) => getUserId(user) === String(plainNotification.actorUserId));

  return {
    ...plainNotification,
    id: String(plainNotification._id),
    actor: actor
      ? {
          id: getUserId(actor),
          firstName: actor.firstName,
          lastName: actor.lastName,
          role: actor.role,
          teamId: actor.teamId,
        }
      : null,
  };
};

exports.getNotifications = async (userId, authHeader) => {
  const notifications = await Notification.find({
    recipientUserId: String(userId),
    isDeleted: false,
  }).sort({ createdAt: -1 });
  const users = await fetchUsers(authHeader);

  return notifications.map((notification) => enrichNotification(notification, users));
};

exports.markAsRead = async (id, userId, authHeader) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientUserId: String(userId) },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    const error = new Error("Bildirim bulunamadı.");
    error.statusCode = 404;
    throw error;
  }

  const users = await fetchUsers(authHeader);
  return enrichNotification(notification, users);
};

exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipientUserId: String(userId), isDeleted: false },
    { isRead: true },
  );
};

exports.deleteNotification = async (id, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientUserId: String(userId) },
    { isDeleted: true },
    { new: true },
  );

  if (!notification) {
    const error = new Error("Bildirim bulunamadı.");
    error.statusCode = 404;
    throw error;
  }
};

exports.deleteAllNotifications = async (userId) => {
  await Notification.updateMany(
    { recipientUserId: String(userId), isDeleted: false },
    { isDeleted: true },
  );
};

exports.createNotifications = async (rawNotifications, authHeader) => {
  const notifications = Array.isArray(rawNotifications)
    ? rawNotifications
    : [rawNotifications].filter(Boolean);
  const safeNotifications = notifications.filter(
    (notification) =>
      String(notification?.recipientUserId ?? "") !==
      String(notification?.actorUserId ?? ""),
  );

  if (!notifications.length) {
    const error = new Error("Bildirim içeriği zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  if (!safeNotifications.length) return [];

  const createdNotifications = await Notification.insertMany(safeNotifications);
  const users = await fetchUsers(authHeader);
  return createdNotifications.map((notification) => enrichNotification(notification, users));
};
