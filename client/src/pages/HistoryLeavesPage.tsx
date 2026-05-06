import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Navigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";
import LeaveDetailPopup from "../components/LeaveDetailPopup";
import { useAuth } from "../context/authContext";
import { api } from "../services/api";

interface LeaveItem {
  id?: number;
  leaveId: number;
  userId?: string;
  firstName: string;
  lastName: string;
  teamName?: string;
  reason?: string;
  details?: string;
  description?: string;
  startDate: string;
  days: number;
  status: "approved" | "pending" | "rejected" | string;
  totalAllowed?: number;
  createdAt?: string;
}

const statusConfig = {
  approved: {
    name: "Onaylandı",
    fill: "#10b981",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  rejected: {
    name: "Reddedildi",
    fill: "#f43f5e",
    badge: "bg-rose-50 text-rose-600 border-rose-200",
  },
  pending: {
    name: "Bekliyor",
    fill: "#f59e0b",
    badge: "bg-amber-50 text-amber-600 border-amber-200",
  },
};

const months = [
  { value: "all", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];

const employeeName = (leave: LeaveItem) =>
  `${leave.firstName || "Bilinmiyor"} ${leave.lastName || ""}`.trim();

const formatDate = (date?: string) =>
  date
    ? DateTime.fromISO(date).setLocale("tr").toLocaleString(DateTime.DATE_MED)
    : "Bilinmiyor";

const HistoryLeavesPage = () => {
  const { user } = useAuth();
  const [allLeaves, setAllLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<LeaveItem | null>(null);
  const [year, setYear] = useState(String(DateTime.now().year));
  const [month, setMonth] = useState("all");
  const [team, setTeam] = useState("all");
  const [status, setStatus] = useState("all");
  const [employee, setEmployee] = useState("all");

  const userRole = user?.role?.toLowerCase();
  const canManageLeaves = userRole === "admin" || userRole === "team_lead";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = userRole === "admin" ? "/leaves/all" : "/leaves/manager-view";
        const result = await api.get(endpoint);
        if (result.success && Array.isArray(result.data)) {
          setAllLeaves(result.data);
        }
      } catch (error) {
        console.error("Veriler alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    if (canManageLeaves) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userRole, canManageLeaves]);

  const filterOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        allLeaves
          .map((leave) => DateTime.fromISO(leave.startDate).year)
          .filter(Number.isFinite),
      ),
    ).sort((a, b) => b - a);
    const teams = Array.from(
      new Set(allLeaves.map((leave) => leave.teamName || "Bilinmiyor")),
    ).sort((a, b) => a.localeCompare(b, "tr"));
    const employees = Array.from(
      new Set(allLeaves.map((leave) => employeeName(leave))),
    ).sort((a, b) => a.localeCompare(b, "tr"));

    return {
      years: years.length ? years.map(String) : [String(DateTime.now().year)],
      teams,
      employees,
    };
  }, [allLeaves]);

  const filteredLeaves = useMemo(() => {
    return allLeaves.filter((leave) => {
      const leaveDate = DateTime.fromISO(leave.startDate);
      const leaveTeam = leave.teamName || "Bilinmiyor";
      const leaveStatus = leave.status || "pending";
      const leaveEmployee = employeeName(leave);

      return (
        String(leaveDate.year) === year &&
        (month === "all" || String(leaveDate.month) === month) &&
        (team === "all" || leaveTeam === team) &&
        (status === "all" || leaveStatus === status) &&
        (employee === "all" || leaveEmployee === employee)
      );
    });
  }, [allLeaves, month, employee, status, team, year]);

  const historyItems = useMemo(() => {
    return [...filteredLeaves].sort(
      (a, b) =>
        DateTime.fromISO(b.startDate).toMillis() -
        DateTime.fromISO(a.startDate).toMillis(),
    );
  }, [filteredLeaves]);

  const selectedLeaveStats = useMemo(() => {
    if (!selectedLeave) return null;

    const userLeaves = allLeaves.filter(
      (leave) => String(leave.userId) === String(selectedLeave.userId),
    );
    const totalAllowed =
      selectedLeave.totalAllowed || userLeaves[0]?.totalAllowed || 20;
    const totalUsed = userLeaves
      .filter((leave) => leave.status === "approved")
      .reduce((sum, leave) => sum + Number(leave.days || 0), 0);

    return {
      totalUsed,
      totalAllowed,
      remaining: Math.max(0, totalAllowed - totalUsed),
      pendingCount: userLeaves.filter((leave) => leave.status === "pending")
        .length,
      approvedCount: userLeaves.filter((leave) => leave.status === "approved")
        .length,
      rejectedCount: userLeaves.filter((leave) => leave.status === "rejected")
        .length,
      ratio: totalUsed / totalAllowed,
    };
  }, [allLeaves, selectedLeave]);

  if (!canManageLeaves) {
    return <Navigate to="/main" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-bold text-gray-500">
        Veriler hazırlanıyor...
      </div>
    );
  }

  return (
    <div>
      <div className="no-scrollbar cursor-default absolute top-20 bottom-20 left-72 right-8 flex flex-col gap-4">
        <DashboardCard className="shrink-0">
          <div className="grid grid-cols-5 gap-4">
            <FilterSelect label="Yıl" value={year} onChange={setYear}>
              {filterOptions.years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Ay" value={month} onChange={setMonth}>
              {months.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Takım" value={team} onChange={setTeam}>
              <option value="all">Tüm Takımlar</option>
              {filterOptions.teams.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Çalışan"
              value={employee}
              onChange={setEmployee}
            >
              <option value="all">Tüm Çalışanlar</option>
              {filterOptions.employees.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Durum" value={status} onChange={setStatus}>
              <option value="all">Tüm Durumlar</option>
              <option value="approved">Onaylanan</option>
              <option value="pending">Bekleyen</option>
              <option value="rejected">Reddedilen</option>
            </FilterSelect>
          </div>
        </DashboardCard>

        <DashboardCard className="flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <table className="w-full border-separate border-spacing-y-3 text-left -mt-3">
              <tbody>
                {historyItems.length ? (
                  historyItems.map((leave) => {
                    const config =
                      statusConfig[leave.status as keyof typeof statusConfig] ||
                      statusConfig.pending;
                    const endDate = DateTime.fromISO(leave.startDate)
                      .plus({ days: leave.days - 1 })
                      .setLocale("tr")
                      .toLocaleString(DateTime.DATE_MED);
                    return (
                      <tr
                        key={leave.leaveId}
                        onClick={() => setSelectedLeave(leave)}
                        className="group cursor-pointer text-sm font-semibold text-gray-700 transition-all duration-200"
                      >
                        <td className="bg-white border-y-2 border-l-2 border-gray-200 rounded-l-2xl px-4 py-4 group-hover:bg-gray-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${leave.firstName}%${leave.lastName}`}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            {employeeName(leave)}
                          </div>
                        </td>
                        <td className="bg-white border-y-2 border-gray-200 px-4 py-4 group-hover:bg-gray-200 transition-colors">
                          {leave.teamName || "Bilinmiyor"}
                        </td>
                        <td className="bg-white border-y-2 border-gray-200 px-4 py-4 group-hover:bg-gray-200 transition-colors">
                          <span className="truncate max-w-[150px] block">
                            {leave.reason || "Belirtilmemiş"}
                          </span>
                        </td>
                        <td className="bg-white border-y-2 border-gray-200 px-4 py-4 group-hover:bg-gray-200 transition-colors">
                          {formatDate(leave.startDate)}
                        </td>
                        <td className="bg-white border-y-2 border-gray-200 px-4 py-4 group-hover:bg-gray-200 transition-colors">
                          {endDate}
                        </td>
                        <td className="bg-white border-y-2 border-gray-200 px-4 py-4 text-center group-hover:bg-gray-200 transition-colors">
                          <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                            {leave.days} gün
                          </span>
                        </td>
                        <td className="bg-white border-y-2 border-r-2 border-gray-200 rounded-r-2xl px-4 py-4 text-right group-hover:bg-gray-200 transition-colors">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs whitespace-nowrap ${config.badge}`}
                          >
                            {config.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm italic text-gray-400"
                    >
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </div>

      <LeaveDetailPopup
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="İstek Geçmişi Detayı"
        leaveData={
          selectedLeave
            ? {
                ...selectedLeave,
                employeeName: employeeName(selectedLeave),
                description:
                  selectedLeave.details || selectedLeave.description || "",
              }
            : null
        }
        stats={selectedLeaveStats}
        showStatsHistory={true}
      />
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

const FilterSelect = ({
  label,
  value,
  onChange,
  children,
}: FilterSelectProps) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-10 rounded-lg border-2 border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition-colors focus:border-gray-700"
  >
    {children}
  </select>
);

export default HistoryLeavesPage;
