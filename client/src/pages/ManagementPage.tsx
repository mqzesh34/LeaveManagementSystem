import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users, Plus, RefreshCw, ChevronDown, ShieldCheck, Trash2, ArrowLeft, XCircle, Save, UserRoundPlus, UserCog, AlertTriangle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DashboardCard from "../components/DashboardCard";
import DashboardList from "../components/DashboardList";
import EmployeeListItem from "../components/EmployeeListItem";
import LeaveStatsOverview from "../components/LeaveStatsOverview";
import Popup from "../components/Popup";
import { api, authApi } from "../services/api";

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const inputClass =
  "w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-blue-500 focus:outline-none font-semibold text-gray-700";

const formatRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: "Yönetici",
    team_lead: "Takım Lideri",
    employee: "Çalışan",
  };

  return labels[role] || role;
};

const ManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: generatePassword(),
  });
  const [teamName, setTeamName] = useState("");
  const [newTeamLeadId, setNewTeamLeadId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberPopupOpen, setMemberPopupOpen] = useState(false);
  const [savingMembers, setSavingMembers] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [removingUser, setRemovingUser] = useState(false);
  const [userDeleteConfirmOpen, setUserDeleteConfirmOpen] = useState(false);
  const [teamSettingsPopupOpen, setTeamSettingsPopupOpen] = useState(false);
  const [savingTeamSettings, setSavingTeamSettings] = useState(false);
  const [teamLeadIdForUpdate, setTeamLeadIdForUpdate] = useState("");
  const [teamNameForUpdate, setTeamNameForUpdate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, teamsResult, leavesResult] = await Promise.all([
        authApi.getUsers(),
        api.get("/teams"),
        api.get("/leaves/all"),
      ]);

      if (usersResult.success) setUsers(usersResult.data);
      if (teamsResult.success) setTeams(teamsResult.data);
      if (leavesResult.success) setLeaves(leavesResult.data);
    } catch (error: any) {
      toast.error(error?.message || "Takım verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTeamId && !teams.some((team) => String(team.id) === String(selectedTeamId))) {
      setSelectedTeamId("");
    }
  }, [selectedTeamId, teams]);

  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.id) === String(selectedTeamId)),
    [selectedTeamId, teams],
  );

  const selectedUserTeam = useMemo(() => {
    if (!selectedUser?.teamId) return null;
    return teams.find((team) => Number(team.id) === Number(selectedUser.teamId)) || null;
  }, [selectedUser, teams]);

  const selectedUserId = selectedUser ? String(selectedUser._id ?? selectedUser.id) : "";
  const selectedUserIsTeamLead =
    !!selectedUserTeam &&
    String(selectedUserTeam.teamLead?.id ?? selectedUserTeam.teamLeadId) === selectedUserId;

  const selectedUserLeaveStats = useMemo(() => {
    const userLeaves = leaves.filter((leave) => String(leave.userId) === selectedUserId && leave.leaveId);
    const totalAllowed = userLeaves[0]?.totalAllowed ?? 20;
    const approvedLeaves = userLeaves.filter((leave) => leave.status === "approved");
    const pendingCount = userLeaves.filter((leave) => leave.status === "pending").length;
    const rejectedCount = userLeaves.filter((leave) => leave.status === "rejected").length;
    const totalUsed = approvedLeaves.reduce((sum, leave) => sum + (leave.days ?? 0), 0);

    return {
      totalUsed,
      totalAllowed,
      approvedCount: approvedLeaves.length,
      pendingCount,
      rejectedCount,
    };
  }, [leaves, selectedUserId]);

  const selectedTeamEmployees = useMemo(() => {
    if (!selectedTeam) return [];

    return (selectedTeam.members || []).filter(
      (member: any) =>
        member.role !== "team_lead" &&
        String(member.id) !== String(selectedTeam.teamLead?.id ?? selectedTeam.teamLeadId),
    );
  }, [selectedTeam]);

  useEffect(() => {
    setSelectedMemberIds(selectedTeamEmployees.map((member: any) => String(member.id)));
  }, [selectedTeamEmployees]);

  const selectableMembers = useMemo(() => {
    if (!selectedTeam) return [];

    return users.filter((user) => {
      const userId = String(user._id ?? user.id);
      const selectedLeadId = String(selectedTeam.teamLead?.id ?? selectedTeam.teamLeadId ?? "");

      return (
        user.role === "employee" &&
        userId !== selectedLeadId &&
        (!user.teamId || Number(user.teamId) === Number(selectedTeam.id))
      );
    });
  }, [selectedTeam, users]);

  const leadCandidates = useMemo(() => {
    if (!selectedTeam) return [];

    return users.filter(
      (user) =>
        user.role !== "admin" &&
        (!user.teamId || Number(user.teamId) === Number(selectedTeam.id)),
    );
  }, [selectedTeam, users]);

  const visibleUsers = useMemo(
    () => users.filter((user) => user.role !== "admin"),
    [users],
  );

  const handleCreateUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email) {
      toast.error("Kullanıcı bilgilerini eksiksiz doldurun.");
      return;
    }

    await authApi.createUser(userForm);
    toast.success("Kullanıcı oluşturuldu.");
    setUserForm({ firstName: "", lastName: "", email: "", password: generatePassword() });
    loadData();
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !newTeamLeadId) {
      toast.error("Takım adı ve lideri zorunludur.");
      return;
    }

    const result = await api.post("/teams", { teamName, teamLeadId: newTeamLeadId });
    toast.success("Takım oluşturuldu.");
    setTeamName("");
    setNewTeamLeadId("");
    await loadData();
    if (result?.data?.id) setSelectedTeamId(String(result.data.id));
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setDeletingTeam(true);
      await api.delete(`/teams/${selectedTeam.id}`);
      toast.success("Takım silindi.");
      setDeletePopupOpen(false);
      setSelectedTeamId("");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Takım silinemedi.");
    } finally {
      setDeletingTeam(false);
    }
  };

  const openMemberPopup = () => {
    if (!selectedTeam) return;
    setMemberPopupOpen(true);
  };

  const openTeamSettingsPopup = () => {
    if (!selectedTeam) return;
    setTeamNameForUpdate(selectedTeam.teamName ?? "");
    setTeamLeadIdForUpdate(String(selectedTeam.teamLead?.id ?? selectedTeam.teamLeadId ?? ""));
    setTeamSettingsPopupOpen(true);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleSaveMembers = async () => {
    if (!selectedTeam) return;

    try {
      setSavingMembers(true);
      await api.put(`/teams/${selectedTeam.id}/members`, { userIds: selectedMemberIds });
      toast.success("Takım çalışanları güncellendi.");
      setMemberPopupOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Takım çalışanları güncellenemedi.");
    } finally {
      setSavingMembers(false);
    }
  };

  const handleUpdateTeamSettings = async () => {
    if (!selectedTeam || !teamNameForUpdate.trim() || !teamLeadIdForUpdate) {
      toast.error("Takım adı ve lideri zorunludur.");
      return;
    }

    try {
      setSavingTeamSettings(true);
      await api.put(`/teams/${selectedTeam.id}`, {
        teamName: teamNameForUpdate,
        teamLeadId: teamLeadIdForUpdate,
      });
      toast.success("Takım ayarları güncellendi.");
      setTeamSettingsPopupOpen(false);
      setTeamLeadIdForUpdate("");
      setTeamNameForUpdate("");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Takım ayarları güncellenemedi.");
    } finally {
      setSavingTeamSettings(false);
    }
  };

  const handleDeleteSelectedUserAccount = async () => {
    if (!selectedUser || !selectedUserId) return;

    try {
      setRemovingUser(true);
      await authApi.deleteUser(selectedUserId);
      toast.success("Kullanıcı hesabı silindi.");
      setUserDeleteConfirmOpen(false);
      setSelectedUser(null);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Kullanıcı hesabı silinemedi.");
    } finally {
      setRemovingUser(false);
    }
  };

  const userDetailOverlay = selectedUser ? (
    <AnimatePresence>
      {userDeleteConfirmOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-center flex flex-col items-center gap-4 p-8"
          >
            {selectedUserIsTeamLead ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center"
                >
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Takım Lideri Silinemez
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md">
                    Bu kullanıcı bir takımın lideri olduğu için hesabı silinemez. Önce takım liderini değiştirmeniz gerekir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserDeleteConfirmOpen(false)}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200 text-sm font-semibold transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri Dön
                </button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center"
                >
                  <XCircle className="w-8 h-8 text-rose-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Kullanıcının Hesabını Siliyorsunuz
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md">
                    Bu kullanıcı hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setUserDeleteConfirmOpen(false)}
                    disabled={removingUser}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedUserAccount}
                    disabled={removingUser}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 border-2 border-rose-500 hover:border-rose-600 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    {removingUser ? "Siliniyor..." : "Evet, Sil"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;


  return (
    <>
    <div className="absolute top-20 bottom-20 left-72 right-8 grid grid-cols-3 gap-4">
      <DashboardCard
        title="Kullanıcı Oluştur"
        icon={<UserPlus className="w-7 h-7 text-blue-500" />}
        className="h-full min-h-0"
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Ad" value={userForm.firstName} onChange={(event) => setUserForm({ ...userForm, firstName: event.target.value })} />
            <input className={inputClass} placeholder="Soyad" value={userForm.lastName} onChange={(event) => setUserForm({ ...userForm, lastName: event.target.value })} />
          </div>
          <input className={inputClass} placeholder="E-posta" type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
          <div className="relative flex items-center">
            <input
              className={`${inputClass} pr-12 font-mono tracking-widest`}
              type="text"
              value={userForm.password}
              readOnly
              placeholder="Otomatik şifre"
            />
            <div className="absolute right-2 flex items-center">
              <button
                type="button"
                onClick={() => setUserForm((f) => ({ ...f, password: generatePassword() }))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Yeni şifre üret"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button onClick={handleCreateUser} className="mt-1 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Kullanıcı Oluştur
          </button>
        </div>

        <div className="h-px bg-gray-200 my-5" />

        <DashboardList
          allItems={visibleUsers}
          loading={loading}
          emptyText="Kullanıcı bulunmuyor."
          disableLimit={true}
          showScrollbar={true}
          renderItem={(user: any) => (
            <EmployeeListItem
              key={user._id ?? user.id}
              firstName={user.firstName}
              lastName={user.lastName}
              primaryText={`${user.firstName} ${user.lastName}`}
              secondaryText={user.email}
              badgeContent={formatRoleLabel(user.role)}
              onClick={() => setSelectedUser(user)}
            />
          )}
        />
      </DashboardCard>

      <DashboardCard
        title="Takım Oluştur"
        icon={<Users className="w-7 h-7 text-emerald-500" />}
        className="h-full min-h-0"
      >
        <div className="flex flex-col gap-3">
          <input className={inputClass} placeholder="Takım adı" value={teamName} onChange={(event) => setTeamName(event.target.value)} />
          <div className="relative">
            <select
              className={`w-full p-3.5 pr-10 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-blue-500 focus:outline-none transition-all duration-200 font-semibold appearance-none ${
                newTeamLeadId === "" ? "text-gray-400" : "text-gray-700"
              }`}
              value={newTeamLeadId}
              onChange={(event) => setNewTeamLeadId(event.target.value)}
            >
              <option value="" disabled hidden>
                Takım lideri seçin
              </option>
              {users.filter((user) => user.role !== "admin" && !user.teamId).map((user) => (
                <option key={user._id ?? user.id} value={user._id ?? user.id}>{user.firstName} {user.lastName}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          <button onClick={handleCreateTeam} className="py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Takım Oluştur
          </button>
        </div>

        <div className="h-px bg-gray-200 my-5" />

        <DashboardList
          allItems={teams}
          loading={loading}
          emptyText="Takım bulunmuyor."
          disableLimit={true}
          showScrollbar={true}
          renderItem={(team: any) => (
            <EmployeeListItem
              key={team.id}
              primaryText={team.teamName}
              secondaryText={team.teamLead ? `${team.teamLead.firstName} ${team.teamLead.lastName}` : "Lider atanmadı"}
              badgeContent={`${team.members?.length ?? 0} kişi`}
              onClick={() => setSelectedTeamId(String(team.id))}
              className={String(team.id) === String(selectedTeamId) ? "bg-gray-200" : ""}
            />
          )}
        />
      </DashboardCard>

      <DashboardCard
        title="Takım Bilgileri"
        icon={<ShieldCheck className="w-7 h-7 text-amber-500" />}
        className="h-full min-h-0"
      >
        {selectedTeam ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-800 truncate">{selectedTeam.teamName}</p>
                <p className="text-sm text-gray-500 truncate">
                  {selectedTeam.teamLead
                    ? `${selectedTeam.teamLead.firstName} ${selectedTeam.teamLead.lastName}`
                    : "Lider atanmadı"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-800">
                {selectedTeam.members?.length ?? 0} kişi
              </span>
              <button
                type="button"
                onClick={openTeamSettingsPopup}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                title="Takım ayarları"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-xl border-2 border-gray-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Takım lideri</p>
                <p className="mt-1 text-sm font-bold text-gray-800 truncate">
                  {selectedTeam.teamLead
                    ? `${selectedTeam.teamLead.firstName} ${selectedTeam.teamLead.lastName}`
                    : "Atanmadı"}
                </p>
              </div>
              <div className="rounded-xl border-2 border-gray-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Çalışan</p>
                <p className="mt-1 text-sm font-bold text-gray-800">{selectedTeamEmployees.length} kişi</p>
              </div>
            </div>

            <button
              type="button"
              onClick={openMemberPopup}
              className="py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <UserCog className="w-5 h-5" />
              Çalışanları Yönet
            </button>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-1 flex items-center gap-2 shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Takımdaki Çalışanlar
                </h2>
              </div>

              <div className="flex-1 min-h-0 space-y-2 overflow-y-auto no-scrollbar">
                {selectedTeamEmployees.length === 0 ? (
                  <div className="flex h-full min-h-24 flex-col items-center justify-center text-center text-gray-400">
                    <UserRoundPlus className="mb-2 h-7 w-7" />
                    <p className="text-sm italic">Bu takımda lider dışında çalışan bulunmuyor.</p>
                  </div>
                ) : (
                  selectedTeamEmployees.map((member: any) => (
                    <EmployeeListItem
                      key={member.id}
                      firstName={member.firstName}
                      lastName={member.lastName}
                      primaryText={`${member.firstName} ${member.lastName}`}
                      secondaryText={member.email}
                      badgeContent={formatRoleLabel(member.role)}
                    />
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDeletePopupOpen(true)}
              className="py-3 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Takımı Sil
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              Bilgilerini görmek için bir takım seçin.
            </p>
          </div>
        )}
      </DashboardCard>

    </div>

    <Popup
      isOpen={!!selectedUser}
      onClose={() => {
        setUserDeleteConfirmOpen(false);
        setSelectedUser(null);
      }}
      title="Kullanıcı Detayları"
    >
      {selectedUser && (
        <div className="relative grid grid-cols-5 gap-6">
          {userDetailOverlay}
          <div className="col-span-2 flex flex-col gap-4 rounded-2xl border-2 border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.firstName}%${selectedUser.lastName}`}
                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-800 truncate">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{selectedUser.email}</p>
              </div>
            </div>

            {selectedUserTeam && (
              <>
                <div className="h-px bg-gray-200" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                    <span className="text-sm font-semibold text-gray-500">Takım Adı</span>
                    <span className="text-sm font-bold text-gray-800 truncate max-w-[150px]">
                      {selectedUserTeam.teamName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                    <span className="text-sm font-semibold text-gray-500">Takım Statüsü</span>
                    <span className="text-sm font-bold text-gray-800">
                      {selectedUserIsTeamLead ? "Takım Lideri" : "Çalışan"}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-gray-200" />

            <LeaveStatsOverview
              totalUsed={selectedUserLeaveStats.totalUsed}
              totalAllowed={selectedUserLeaveStats.totalAllowed}
              approvedCount={selectedUserLeaveStats.approvedCount}
              pendingCount={selectedUserLeaveStats.pendingCount}
              rejectedCount={selectedUserLeaveStats.rejectedCount}
            />

            <button
              type="button"
              onClick={() => setUserDeleteConfirmOpen(true)}
              disabled={removingUser}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-600 transition-all duration-200 hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AlertTriangle className="w-4 h-4" />
              {removingUser ? "Siliniyor..." : "Hesabı Sil"}
            </button>
          </div>

          <div className="col-span-3 bg-white border-gray-200 border-2 rounded-2xl p-5 flex min-h-[360px] flex-col">
            <div className="flex-1" />
          </div>
        </div>
      )}
    </Popup>

    <Popup
      isOpen={teamSettingsPopupOpen && !!selectedTeam}
      onClose={() => {
        if (!savingTeamSettings) setTeamSettingsPopupOpen(false);
      }}
      title="Takım Ayarları"
    >
      {selectedTeam && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-xl border-2 border-gray-200 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <ShieldCheck className="h-6 w-6 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-gray-800 truncate">{selectedTeam.teamName}</p>
              <p className="text-sm text-gray-500 truncate">
                Mevcut lider:{" "}
                {selectedTeam.teamLead
                  ? `${selectedTeam.teamLead.firstName} ${selectedTeam.teamLead.lastName}`
                  : "Atanmadı"}
              </p>
            </div>
          </div>

          <input
            className={inputClass}
            value={teamNameForUpdate}
            onChange={(event) => setTeamNameForUpdate(event.target.value)}
            disabled={savingTeamSettings}
            placeholder="Takım adı"
          />

          <div className="relative">
            <select
              className={`w-full appearance-none rounded-xl border-2 border-gray-100 bg-gray-50 p-3.5 pr-10 font-semibold transition-all duration-200 focus:border-blue-500 focus:outline-none ${
                teamLeadIdForUpdate === "" ? "text-gray-400" : "text-gray-700"
              }`}
              value={teamLeadIdForUpdate}
              onChange={(event) => setTeamLeadIdForUpdate(event.target.value)}
              disabled={savingTeamSettings || leadCandidates.length === 0}
            >
              <option value="" disabled hidden>
                Takım lideri seçin
              </option>
              {leadCandidates.map((user: any) => (
                <option key={user._id ?? user.id} value={user._id ?? user.id}>
                  {user.firstName} {user.lastName}
                  {user.teamId ? " - takımda" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>

          {leadCandidates.length === 0 && (
            <p className="rounded-xl bg-gray-50 p-3 text-sm font-semibold text-gray-500">
              Takım lideri olarak atanabilecek uygun kullanıcı bulunmuyor.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTeamSettingsPopupOpen(false)}
              disabled={savingTeamSettings}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleUpdateTeamSettings}
              disabled={savingTeamSettings || !teamNameForUpdate.trim() || !teamLeadIdForUpdate}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-gray-900 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingTeamSettings ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </Popup>

    <Popup
      isOpen={memberPopupOpen && !!selectedTeam}
      onClose={() => {
        if (!savingMembers) setMemberPopupOpen(false);
      }}
      title="Çalışanları Yönet"
    >
      {selectedTeam && (
        <div className="flex h-[520px] max-h-[70vh] flex-col gap-4">
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 shrink-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-800 truncate">{selectedTeam.teamName}</p>
              <p className="text-sm text-gray-500 truncate">
                Takıma dahil edilecek veya çıkarılacak çalışanları seçin.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-800">
              {selectedMemberIds.length} seçili
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMemberPopupOpen(false)}
                disabled={savingMembers}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" />
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveMembers}
                disabled={savingMembers}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 border-2 border-gray-900 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {savingMembers ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
            {selectableMembers.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center text-center text-gray-400">
                <UserRoundPlus className="mb-2 h-8 w-8" />
                <p className="text-sm italic">Eklenebilecek çalışan bulunmuyor.</p>
              </div>
            ) : (
              selectableMembers.map((user: any) => {
                const userId = String(user._id ?? user.id);
                const checked = selectedMemberIds.includes(userId);

                return (
                  <label
                    key={userId}
                    className={`flex items-center gap-3 rounded-lg border-2 p-2 transition-colors cursor-pointer ${
                      checked ? "bg-gray-200 border-gray-300" : "border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(userId)}
                      className="h-4 w-4 accent-gray-900"
                    />
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%${user.lastName}`}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-800">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{user.email}</span>
                    </span>
                    {user.teamId && Number(user.teamId) === Number(selectedTeam.id) && (
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-700">
                        Takımda
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

        </div>
      )}
    </Popup>

    <Popup
      isOpen={deletePopupOpen && !!selectedTeam}
      onClose={() => {
        if (!deletingTeam) setDeletePopupOpen(false);
      }}
      title="Takımı Sil"
    >
      {selectedTeam && (
        <div className="relative flex min-h-[320px] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-center flex flex-col items-center gap-4 p-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center"
            >
              <XCircle className="w-8 h-8 text-rose-600" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {selectedTeam.teamName} Takımını Siliyorsunuz
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Bu işlem takımı ve tüm izin isteklerini tamamen silecek. Bekleyen izin talebi var ise takım silinemez. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setDeletePopupOpen(false)}
                disabled={deletingTeam}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" />
                Geri Dön
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={deletingTeam}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 border-2 border-rose-500 hover:border-rose-600 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deletingTeam ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Popup>
    </>
  );
};

export default ManagementPage;
