const { Team, Leave } = require("../models");

const AUTH_USERS_URL = `${process.env.AUTH_SERVICE_URL}/api/auth/users`;

const requestAuthService = async (path, options = {}) => {
  const { authHeader, ...fetchOptions } = options;
  const response = await fetch(`${AUTH_USERS_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    const error = new Error(data.message || "Auth service isteği başarısız.");
    error.statusCode = response.status || 500;
    throw error;
  }

  return data.data;
};

const fetchUsers = async (authHeader) => {
  return requestAuthService("", { authHeader });
};

const updateUserAssignment = async (userId, assignment, authHeader) => {
  return requestAuthService(`/${userId}/assignment`, {
    method: "PUT",
    authHeader,
    body: JSON.stringify(assignment),
  });
};

const enrichTeams = async (teams, authHeader) => {
  const users = await fetchUsers(authHeader);

  return teams.map((team) => {
    const plainTeam = team.get ? team.get({ plain: true }) : team;
    const teamLead = users.find((user) => String(user._id ?? user.id) === String(plainTeam.teamLeadId));
    const members = users.filter((user) => Number(user.teamId) === Number(plainTeam.id));

    return {
      ...plainTeam,
      teamLead: teamLead
        ? {
            id: String(teamLead._id ?? teamLead.id),
            firstName: teamLead.firstName,
            lastName: teamLead.lastName,
            email: teamLead.email,
          }
        : null,
      members: members.map((member) => ({
        id: String(member._id ?? member.id),
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
      })),
    };
  });
};

exports.getTeams = async (authHeader) => {
  const teams = await Team.findAll({ order: [["id", "ASC"]] });
  return enrichTeams(teams, authHeader);
};

exports.getMyTeam = async (currentUser) => {
  if (!currentUser?.teamId) return null;

  const team = await Team.findByPk(currentUser.teamId);
  if (!team) return null;

  return team.get({ plain: true });
};

exports.createTeam = async (teamName, teamLeadId, authHeader) => {
  if (!teamName?.trim()) {
    const error = new Error("Takım adı zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  if (!teamLeadId) {
    const error = new Error("Takım lideri zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  const users = await fetchUsers(authHeader);
  const targetUser = users.find((user) => String(user._id ?? user.id) === String(teamLeadId));
  if (!targetUser || targetUser.role === "admin") {
    const error = new Error("Admin kullanıcı takım lideri olarak atanamaz.");
    error.statusCode = 400;
    throw error;
  }

  if (targetUser.teamId) {
    const error = new Error("Bu kullanıcı zaten başka bir takımda yer alıyor.");
    error.statusCode = 400;
    throw error;
  }

  const team = await Team.create({ teamName: teamName.trim(), teamLeadId: String(teamLeadId) });
  await updateUserAssignment(teamLeadId, { role: "team_lead", teamId: team.id }, authHeader);

  return team;
};

const changeTeamLead = async (team, userId, authHeader) => {
  if (!userId) {
    const error = new Error("Takım lideri kullanıcı id'si zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  const users = await fetchUsers(authHeader);
  const targetUser = users.find((user) => String(user._id ?? user.id) === String(userId));
  if (!targetUser || targetUser.role === "admin") {
    const error = new Error("Admin kullanıcı takım lideri olarak atanamaz.");
    error.statusCode = 400;
    throw error;
  }

  if (targetUser.teamId && Number(targetUser.teamId) !== Number(team.id)) {
    const error = new Error("Başka bir takımda yer alan kullanıcı takım lideri olarak atanamaz.");
    error.statusCode = 400;
    throw error;
  }

  const previousLeadId = team.teamLeadId;
  team.teamLeadId = String(userId);
  await team.save();

  await updateUserAssignment(userId, { role: "team_lead", teamId: team.id }, authHeader);

  if (previousLeadId && String(previousLeadId) !== String(userId)) {
    const otherLedTeam = await Team.findOne({ where: { teamLeadId: String(previousLeadId) } });
    if (!otherLedTeam) {
      await updateUserAssignment(previousLeadId, { role: "employee", teamId: team.id }, authHeader);
    }
  }

  return team;
};

exports.updateTeam = async (teamId, updates, authHeader) => {
  const team = await Team.findByPk(teamId);
  if (!team) {
    const error = new Error("Takım bulunamadı.");
    error.statusCode = 404;
    throw error;
  }

  if (updates.teamName !== undefined) {
    if (!updates.teamName?.trim()) {
      const error = new Error("Takım adı zorunludur.");
      error.statusCode = 400;
      throw error;
    }

    team.teamName = updates.teamName.trim();
  }

  if (updates.teamLeadId !== undefined) {
    return changeTeamLead(team, updates.teamLeadId, authHeader);
  }

  await team.save();
  return team;
};

exports.assignTeamMembers = async (teamId, userIds, authHeader) => {
  if (!Array.isArray(userIds)) {
    const error = new Error("Çalışan listesi zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  const team = await Team.findByPk(teamId);
  if (!team) {
    const error = new Error("Takım bulunamadı.");
    error.statusCode = 404;
    throw error;
  }

  const users = await fetchUsers(authHeader);
  const invalidMember = userIds.find((userId) => {
    const user = users.find((item) => String(item._id ?? item.id) === String(userId));
    return !user || user.role !== "employee";
  });

  if (invalidMember) {
    const error = new Error("Takıma yalnızca normal çalışanlar eklenebilir.");
    error.statusCode = 400;
    throw error;
  }

  const alreadyAssignedMember = userIds.find((userId) => {
    const user = users.find((item) => String(item._id ?? item.id) === String(userId));
    return user?.teamId && Number(user.teamId) !== Number(team.id);
  });

  if (alreadyAssignedMember) {
    const error = new Error("Bir çalışan aynı anda yalnızca bir takımda yer alabilir.");
    error.statusCode = 400;
    throw error;
  }

  const selectedUserIds = userIds.map(String);
  const currentMemberIds = users
    .filter(
      (user) =>
        user.role === "employee" &&
        Number(user.teamId) === Number(team.id) &&
        String(user._id ?? user.id) !== String(team.teamLeadId),
    )
    .map((user) => String(user._id ?? user.id));

  const removedMemberIds = currentMemberIds.filter(
    (userId) => !selectedUserIds.includes(userId),
  );

  await Promise.all(
    [
      ...selectedUserIds
        .filter((userId) => String(userId) !== String(team.teamLeadId))
        .map((userId) => updateUserAssignment(userId, { role: "employee", teamId: team.id }, authHeader)),
      ...removedMemberIds.map((userId) =>
        updateUserAssignment(userId, { role: "employee", teamId: null }, authHeader),
      ),
    ],
  );

  return team;
};

exports.deleteTeam = async (teamId, authHeader) => {
  const team = await Team.findByPk(teamId);
  if (!team) {
    const error = new Error("Takım bulunamadı.");
    error.statusCode = 404;
    throw error;
  }

  const pendingLeaveCount = await Leave.count({ where: { teamId: team.id, status: "pending" } });
  if (pendingLeaveCount > 0) {
    const error = new Error("Bekleyen izin talebi olan takımlar silinemez.");
    error.statusCode = 400;
    throw error;
  }

  const users = await fetchUsers(authHeader);
  const assignedUsers = users.filter((user) => Number(user.teamId) === Number(team.id));

  await Leave.destroy({ where: { teamId: team.id } });
  await team.destroy();

  await Promise.all(
    assignedUsers.map((user) =>
      updateUserAssignment(user._id ?? user.id, { role: "employee", teamId: null }, authHeader),
    ),
  );

  return team;
};
