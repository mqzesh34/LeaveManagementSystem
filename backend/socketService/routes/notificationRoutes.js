const express = require("express");
const notificationController = require("../controller/notificationController");
const { authMiddleware } = require("../middleware/authMiddleware");
const serviceTokenMiddleware = require("../middleware/serviceTokenMiddleware");

const router = express.Router();

router.get("/", authMiddleware, notificationController.getNotifications);
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/delete-all", authMiddleware, notificationController.deleteAllNotifications);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);
router.patch("/:id/delete", authMiddleware, notificationController.deleteNotification);
router.post("/", serviceTokenMiddleware, notificationController.createNotifications);

module.exports = router;
