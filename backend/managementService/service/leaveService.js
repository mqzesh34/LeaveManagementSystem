const { Leave, Team } = require("../models");
const { Op } = require("sequelize");

const AUTH_SERVICE_URL = `${process.env.AUTH_SERVICE_URL}/api/auth/users`;

const getUserId = (user) => String(user?._id ?? user?.id ?? "");
const getRole = (user) => user?.role?.toLowerCase();

const fetchUsers = async (authHeader) => {
  const authResponse = await fetch(AUTH_SERVICE_URL, {
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
  const authData = await authResponse.json();
  return authData.success ? authData.data : [];
};

const getTeamNameMap = async () => {
  const teams = await Team.findAll();
  return teams.reduce((map, team) => {
    map[team.id] = team.teamName;
    return map;
  }, {});
};

const enrichLeavesWithUsers = async (leaves, users) => {
  const teamNameMap = await getTeamNameMap();

  return leaves.map((leave) => {
    const plainLeave = leave.get ? leave.get({ plain: true }) : leave;
    const user = users.find((u) => getUserId(u) === String(plainLeave.userId));

    return {
      ...plainLeave,
      status: plainLeave.status?.toLowerCase(),
      firstName: user ? user.firstName : "Bilinmiyor",
      lastName: user ? user.lastName : "",
      role: user ? user.role : undefined,
      userTeamId: user ? user.teamId : undefined,
      teamName: teamNameMap[plainLeave.teamId] || "Bilinmiyor",
      leaveId: plainLeave.id,
    };
  });
};

const getLedTeamIds = async (userId) => {
  const teams = await Team.findAll({ where: { teamLeadId: String(userId) } });
  return teams.map((team) => team.id);
};

const canManageLeave = async (currentUser, leave, users) => {
  const role = currentUser?.role?.toLowerCase();
  const leaveUser = users.find((user) => getUserId(user) === String(leave.userId));

  if (role === "admin") {
    return getRole(leaveUser) === "team_lead";
  }

  if (role === "team_lead") {
    const ledTeamIds = await getLedTeamIds(currentUser.id);
    return (
      ledTeamIds.includes(Number(leave.teamId)) &&
      getRole(leaveUser) === "employee" &&
      getUserId(leaveUser) !== String(currentUser.id)
    );
  }

  return false;
};

exports.getMyLeaves = async (userId) => {
  return await Leave.findAll({ where: { userId: userId } });
};

const resolveLeaveTeamId = async (currentUser) => {
  if (currentUser?.teamId) return currentUser.teamId;

  if (currentUser?.role?.toLowerCase() === "team_lead") {
    const ledTeamIds = await getLedTeamIds(currentUser.id);
    if (ledTeamIds.length) return ledTeamIds[0];
  }

  return null;
};

exports.createLeave = async (currentUser, data) => {
  const { startDate, days, reason, details } = data;
  const userId = currentUser?.id;
  const teamId = await resolveLeaveTeamId(currentUser);
  
  if (!startDate || !days || !reason) {
    const error = new Error('Eksik bilgi: Başlangıç tarihi, gün sayısı ve izin türü zorunludur.');
    error.statusCode = 400;
    throw error;
  }

  if (!userId || !teamId) {
    const error = new Error("İzin talebi oluşturabilmeniz için önce bir takıma atanmış olmanız gerekir.");
    error.statusCode = 400;
    throw error;
  }

  const newLeave = await Leave.create({
    userId,
    teamId,
    startDate,
    days,
    reason,
    details,
    status: 'pending',
  });

  return newLeave;
};

exports.getTeamView = async (currentUser, authHeader) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 90);

    const users = await fetchUsers(authHeader);
    const role = currentUser?.role?.toLowerCase();
    let where = {
      status: "approved",
      startDate: { [Op.between]: [thirtyDaysAgo, thirtyDaysAhead] },
    };

    if (role === "admin") {
      const teamLeadIds = users
        .filter((user) => getRole(user) === "team_lead")
        .map(getUserId);

      if (!teamLeadIds.length) return [];
      where = { ...where, userId: { [Op.in]: teamLeadIds } };
    } else if (role === "team_lead") {
      const ledTeamIds = await getLedTeamIds(currentUser.id);
      const employeeIds = users
        .filter((user) => ledTeamIds.includes(Number(user.teamId)) && getRole(user) === "employee")
        .map(getUserId);
      const visibleUserIds = [...employeeIds, String(currentUser.id)];

      if (!ledTeamIds.length || !visibleUserIds.length) return [];
      where = {
        ...where,
        teamId: { [Op.in]: ledTeamIds },
        userId: { [Op.in]: visibleUserIds },
      };
    } else if (currentUser?.teamId) {
      where = { ...where, teamId: currentUser.teamId };
    }

    const scopedLeaves = await Leave.findAll({ where });
    const teamNameMap = await getTeamNameMap();

    return scopedLeaves.map((leave) => {
      const user = users.find(
        (u) =>
          String(u._id) === String(leave.userId) ||
          String(u.id) === String(leave.userId),
      );
      
      const canSeeDetails = ["admin", "team_lead"].includes(currentUser?.role?.toLowerCase());
      const isOwner = String(currentUser?.id) === String(leave.userId);
      const plainLeave = leave.get({ plain: true });

      if (!canSeeDetails && !isOwner) {
        plainLeave.reason = "İzinli";
        plainLeave.details = null;
      }

      return {
        ...plainLeave,
        status: plainLeave.status?.toLowerCase(),
        firstName: user ? user.firstName : "Çalışan",
        lastName: user ? user.lastName : "",
        teamName: teamNameMap[plainLeave.teamId] || "Bilinmiyor",
        leaveId: leave.id,
      };
    });
  } catch (error) {
    return [];
  }
};

exports.getAllLeaves = async (authHeader) => {
  const users = await fetchUsers(authHeader);
  const leaves = await Leave.findAll();
  return enrichLeavesWithUsers(leaves, users);
};

exports.getManageableLeaves = async (currentUser, authHeader) => {
  try {
    const users = await fetchUsers(authHeader);
    const role = currentUser?.role?.toLowerCase();

    if (role === "admin") {
      const teamLeadIds = users
        .filter((user) => getRole(user) === "team_lead")
        .map(getUserId);

      if (!teamLeadIds.length) return [];

      const leaves = await Leave.findAll({ where: { userId: { [Op.in]: teamLeadIds } } });
      return await enrichLeavesWithUsers(leaves, users);
    }

    if (role === "team_lead") {
      const ledTeamIds = await getLedTeamIds(currentUser.id);
      if (!ledTeamIds.length) return [];

      const employeeIds = users
        .filter((user) => ledTeamIds.includes(Number(user.teamId)) && getRole(user) === "employee")
        .map(getUserId);

      if (!employeeIds.length) return [];

      const leaves = await Leave.findAll({
        where: {
          teamId: { [Op.in]: ledTeamIds },
          userId: { [Op.in]: employeeIds },
        },
      });
      return await enrichLeavesWithUsers(leaves, users);
    }

    const error = new Error("Bu işlem için yetkiniz yok.");
    error.statusCode = 403;
    throw error;
  } catch (error) {
    if (error.statusCode) throw error;
    return [];
  }
};

exports.approveLeave = async (id, currentUser, authHeader) =>{
  const leave = await Leave.findByPk(id)
  if(!leave) throw new Error('İzin talebi bulunamadı.')

  const users = await fetchUsers(authHeader);
  if (!(await canManageLeave(currentUser, leave, users))) {
    const error = new Error("Bu izin talebi için yetkiniz yok.");
    error.statusCode = 403;
    throw error;
  }
  
  leave.status = 'approved'
  await leave.save()
  
  return leave
}

exports.rejectLeave = async (id, currentUser, authHeader) =>{
  const leave = await Leave.findByPk(id)
  if(!leave) throw new Error('İzin talebi bulunamadı.')

  const users = await fetchUsers(authHeader);
  if (!(await canManageLeave(currentUser, leave, users))) {
    const error = new Error("Bu izin talebi için yetkiniz yok.");
    error.statusCode = 403;
    throw error;
  }
  
  leave.status = 'rejected'
  await leave.save()
  
  return leave
}
