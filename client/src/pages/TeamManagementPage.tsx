import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users, ShieldCheck, Plus, Save } from "lucide-react";
import toast from "react-hot-toast";
import DashboardCard from "../components/DashboardCard";
import DashboardList from "../components/DashboardList";
import EmployeeListItem from "../components/EmployeeListItem";
import { api, authApi } from "../services/api";

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

const TeamManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [teamName, setTeamName] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, teamsResult] = await Promise.all([
        authApi.getUsers(),
        api.get("/teams"),
      ]);

      if (usersResult.success) setUsers(usersResult.data);
      if (teamsResult.success) setTeams(teamsResult.data);
    } catch (error: any) {
      toast.error(error?.message || "Takım verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.id) === String(selectedTeamId)),
    [teams, selectedTeamId],
  );

  const selectableMembers = users.filter(
    (user) =>
      user.role === "employee" &&
      String(user._id ?? user.id) !== String(selectedLeadId) &&
      (!user.teamId || String(user.teamId) === String(selectedTeamId)),
  );

  const handleCreateUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password) {
      toast.error("Kullanıcı bilgilerini eksiksiz doldurun.");
      return;
    }

    await authApi.createUser(userForm);
    toast.success("Kullanıcı oluşturuldu.");
    setUserForm({ firstName: "", lastName: "", email: "", password: "" });
    loadData();
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("Takım adı zorunludur.");
      return;
    }

    await api.post("/teams", { teamName });
    toast.success("Takım oluşturuldu.");
    setTeamName("");
    loadData();
  };

  const handleAssignLead = async () => {
    if (!selectedTeamId || !selectedLeadId) {
      toast.error("Takım ve lider seçin.");
      return;
    }

    await api.put(`/teams/${selectedTeamId}/lead`, { userId: selectedLeadId });
    toast.success("Takım lideri atandı.");
    loadData();
  };

  const handleAssignMembers = async () => {
    if (!selectedTeamId) {
      toast.error("Takım seçin.");
      return;
    }

    await api.put(`/teams/${selectedTeamId}/members`, { userIds: selectedMemberIds });
    toast.success("Takım çalışanları atandı.");
    setSelectedMemberIds([]);
    loadData();
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  return (
    <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 grid grid-cols-3 gap-4">
      <DashboardCard
        title="Kullanıcı Oluştur"
        icon={<UserPlus className="w-7 h-7 text-blue-500" />}
        className="h-full"
      >
        <div className="flex flex-col gap-3">
          <input className={inputClass} placeholder="Ad" value={userForm.firstName} onChange={(event) => setUserForm({ ...userForm, firstName: event.target.value })} />
          <input className={inputClass} placeholder="Soyad" value={userForm.lastName} onChange={(event) => setUserForm({ ...userForm, lastName: event.target.value })} />
          <input className={inputClass} placeholder="E-posta" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
          <input className={inputClass} placeholder="Şifre" type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
          <button onClick={handleCreateUser} className="mt-1 py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Oluştur
          </button>
        </div>

        <div className="h-px bg-gray-200 my-5" />

        <DashboardList
          allItems={users}
          loading={loading}
          emptyText="Kullanıcı bulunmuyor."
          disableLimit={true}
          renderItem={(user: any) => (
            <EmployeeListItem
              key={user._id ?? user.id}
              firstName={user.firstName}
              lastName={user.lastName}
              primaryText={`${user.firstName} ${user.lastName}`}
              secondaryText={user.email}
              badgeContent={formatRoleLabel(user.role)}
            />
          )}
        />
      </DashboardCard>

      <DashboardCard
        title="Takım Oluştur"
        icon={<Users className="w-7 h-7 text-emerald-500" />}
        className="h-full"
      >
        <div className="flex gap-2">
          <input className={inputClass} placeholder="Takım adı" value={teamName} onChange={(event) => setTeamName(event.target.value)} />
          <button onClick={handleCreateTeam} className="w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="h-px bg-gray-200 my-5" />

        <DashboardList
          allItems={teams}
          loading={loading}
          emptyText="Takım bulunmuyor."
          disableLimit={true}
          renderItem={(team: any) => (
            <EmployeeListItem
              key={team.id}
              primaryText={team.teamName}
              secondaryText={team.teamLead ? `${team.teamLead.firstName} ${team.teamLead.lastName}` : "Lider atanmadı"}
              badgeContent={`${team.members?.length ?? 0} kişi`}
              onClick={() => {
                setSelectedTeamId(String(team.id));
                setSelectedLeadId(team.teamLeadId || "");
                setSelectedMemberIds((team.members || []).filter((member: any) => member.role !== "team_lead").map((member: any) => String(member.id)));
              }}
            />
          )}
        />
      </DashboardCard>

      <DashboardCard
        title="Takım Atamaları"
        icon={<ShieldCheck className="w-7 h-7 text-amber-500" />}
        className="h-full"
      >
        <div className="flex flex-col gap-3 min-h-0">
          <select className={inputClass} value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
            <option value="">Takım seçin</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.teamName}</option>
            ))}
          </select>

          <select className={inputClass} value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)}>
            <option value="">Takım lideri seçin</option>
            {users.filter((user) => user.role !== "admin").map((user) => (
              <option key={user._id ?? user.id} value={user._id ?? user.id}>{user.firstName} {user.lastName}</option>
            ))}
          </select>

          <button onClick={handleAssignLead} className="py-3 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            Lideri Kaydet
          </button>

          <div className="h-px bg-gray-200 my-2" />

          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {selectedTeam?.teamName || "Seçili takım"} çalışanları
          </p>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2">
            {selectableMembers.map((user) => {
              const userId = String(user._id ?? user.id);
              return (
                <label key={userId} className="flex items-center gap-3 p-2 rounded-lg border-2 border-gray-200 cursor-pointer">
                  <input type="checkbox" checked={selectedMemberIds.includes(userId)} onChange={() => toggleMember(userId)} />
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {user.firstName} {user.lastName}
                  </span>
                </label>
              );
            })}
          </div>

          <button onClick={handleAssignMembers} className="py-3 rounded-xl bg-gray-800 text-white font-bold">
            Çalışanları Kaydet
          </button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default TeamManagementPage;
