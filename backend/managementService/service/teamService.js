const { Team } = require("../models");

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

exports.createTeam = async (teamName) => {
  if (!teamName?.trim()) {
    const error = new Error("Takım adı zorunludur.");
    error.statusCode = 400;
    throw error;
  }

  return Team.create({ teamName: teamName.trim(), teamLeadId: null });
};

exports.assignTeamLead = async (teamId, userId, authHeader) => {
  if (!userId) {
    const error = new Error("Takım lideri kullanıcı id'si zorunludur.");
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
  const targetUser = users.find((user) => String(user._id ?? user.id) === String(userId));
  if (!targetUser || targetUser.role === "admin") {
    const error = new Error("Admin kullanıcı takım lideri olarak atanamaz.");
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
      await updateUserAssignment(previousLeadId, { role: "employee", teamId: null }, authHeader);
    }
  }

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
