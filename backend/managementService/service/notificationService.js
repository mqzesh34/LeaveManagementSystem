const { Team } = require("../models");

const AUTH_USERS_URL = `${process.env.AUTH_SERVICE_URL}/api/auth/users`;
const SOCKET_NOTIFICATIONS_URL = `${process.env.SOCKET_SERVICE_URL}/api/notifications`;

const getUserId = (user) => String(user?._id ?? user?.id ?? "");
const getRole = (user) => user?.role?.toLowerCase();

const fetchUsers = async (authHeader) => {
  const response = await fetch(AUTH_USERS_URL, {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
  const result = await response.json();
  return result.success ? result.data : [];
};

const publishNotifications = async (notifications, authHeader) => {
  if (!process.env.SOCKET_SERVICE_URL || !notifications.length) return;

  try {
    const response = await fetch(SOCKET_NOTIFICATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(process.env.SOCKET_SERVICE_TOKEN
          ? { "x-service-token": process.env.SOCKET_SERVICE_TOKEN }
          : {}),
      },
      body: JSON.stringify({ notifications }),
    });

    if (!response.ok) {
      console.error("Bildirim servisi isteği başarısız:", response.status);
    }
  } catch (error) {
    console.error("Bildirim servisine ulaşılamadı:", error.message);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}`;
};

const getEndDate = (startDateStr, days) => {
  const date = new Date(startDateStr);
  date.setDate(date.getDate() + (days - 1));
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

exports.notifyLeaveCreated = async (leave, currentUser, authHeader) => {
  const actorUserId = String(currentUser?.id ?? leave.userId);
  const users = await fetchUsers(authHeader);
  const actorUser = users.find((user) => getUserId(user) === actorUserId);
  const role = getRole(actorUser) || getRole(currentUser);
  const team = await Team.findByPk(leave.teamId);
  const isTeamLeadLeave =
    role === "team_lead" || String(team?.teamLeadId ?? "") === actorUserId;
  let recipientUserIds = [];

  if (isTeamLeadLeave) {
    recipientUserIds = users
      .filter((user) => getRole(user) === "admin")
      .map(getUserId);
  } else if (role === "employee") {
    if (team?.teamLeadId) recipientUserIds = [String(team.teamLeadId)];
  }

  const dateRange = `${formatDate(leave.startDate)} - ${getEndDate(leave.startDate, leave.days)}`;

  const notifications = recipientUserIds
    .filter((recipientUserId) => recipientUserId && recipientUserId !== actorUserId)
    .map((recipientUserId) => ({
      recipientUserId,
      actorUserId,
      type: "leave_created",
      title: "Yeni İzin Talebi",
      message: `${currentUser.firstName} ${currentUser.lastName} ${dateRange} için izin istedi!`,
      leaveId: leave.id,
    }));

  await publishNotifications(notifications, authHeader);
};

exports.notifyLeaveStatusChanged = async (leave, currentUser, status, authHeader) => {
  const actorUserId = String(currentUser?.id ?? "");
  const recipientUserId = String(leave.userId);
  const approved = status === "approved";

  if (!actorUserId || !recipientUserId || actorUserId === recipientUserId) return;

  const dateRange = `${formatDate(leave.startDate)} - ${getEndDate(leave.startDate, leave.days)}`;

  await publishNotifications(
    [
      {
        recipientUserId,
        actorUserId,
        type: approved ? "leave_approved" : "leave_rejected",
        title: approved ? "İzin Onaylandı" : "İzin Reddedildi",
        message: approved
          ? `${dateRange} tarihleri arasındaki iznin onaylandı!`
          : `${dateRange} tarihleri arasındaki iznin reddedildi.`,
        leaveId: leave.id,
      },
    ],
    authHeader,
  );
};
