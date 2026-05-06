const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: String,
      required: true,
      index: true,
    },
    actorUserId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["leave_created", "leave_approved", "leave_rejected"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    leaveId: {
      type: Number,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
