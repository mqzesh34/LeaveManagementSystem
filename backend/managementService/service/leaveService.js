const { Leave } = require("../models");

const AUTH_SERVICE_URL = "http://localhost:5005/api/auth/users";

exports.getMyLeaves = async (userId) => {
  return await Leave.findAll({ where: { userId: userId } });
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
        leaveId: leave.id,
      };
    });
  } catch (error) {
    return await Leave.findAll();
  }
};
