const { Leave } = require("../models");
const { Op } = require("sequelize");

const AUTH_SERVICE_URL = "http://localhost:5005/api/auth/users";

exports.getMyLeaves = async (userId) => {
  return await Leave.findAll({ where: { userId: userId } });
};

exports.getTeamView = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 1);

    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const leaves = await Leave.findAll({
      where: {
        status: "approved",
        startDate: { [Op.between]: [thirtyDaysAgo, thirtyDaysAhead] },
      },
    });

    const authResponse = await fetch(AUTH_SERVICE_URL);
    const authData = await authResponse.json();
    if (!authData.success) return [];

    const users = authData.data;

    return leaves.map((leave) => {
      const user = users.find(
        (u) =>
          String(u._id) === String(leave.userId) ||
          String(u.id) === String(leave.userId),
      );
      return {
        userId: leave.userId,
        firstName: user ? user.firstName : "Çalışan",
        lastName: user ? user.lastName : "",
        department: user ? user.department : "Bilinmiyor",
        startDate: leave.startDate,
        days: leave.days,
      };
    });
  } catch (error) {
    return [];
  }
};

exports.getAllLeaves = async () => {
  try {
    const leaves = await Leave.findAll();
    const authResponse = await fetch(AUTH_SERVICE_URL);
    const authData = await authResponse.json();

    if (!authData.success) return leaves;

    const users = authData.data;

    return leaves.map((leave) => {
      const user = users.find(
        (u) => String(u._id) === String(leave.userId) || String(u.id) === String(leave.userId)
      );
      return {
        ...leave.get({ plain: true }),
        firstName: user ? user.firstName : "Bilinmiyor",
        lastName: user ? user.lastName : "",
        department: user ? user.department : "Bilinmiyor",
        leaveId: leave.id,
      };
    });
  } catch (error) {
    return await Leave.findAll();
  }
};
