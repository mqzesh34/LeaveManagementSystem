import {
  FileText,
  Send,
  Users,
  CalendarDays,
  History,
  Eye,
} from "lucide-react";
import { DateTime } from "luxon";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";
import EmployeeListItem from "../components/EmployeeListItem";
import DashboardList from "../components/DashboardList";
import { useAuth } from "../context/authContext";
import DateRangePicker from "../components/DateRangePicker";
import DashboardCard from "../components/DashboardCard";
import LeaveStatsOverview from "../components/LeaveStatsOverview";
import LeaveDetailPopup from "../components/LeaveDetailPopup";
import holidaysData from "../data/holidays.json";
import toast from "react-hot-toast";

interface Holiday {
  name: string;
  date: string;
  days: number;
}

const LeaveRequestPage = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myRes, teamRes] = await Promise.all([
          api.get("/leaves/my"),
          api.get("/leaves/team-view")
        ]);

        if (myRes.success && Array.isArray(myRes.data)) setMyLeaves(myRes.data);
        if (teamRes.success && Array.isArray(teamRes.data)) setTeamLeaves(teamRes.data);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const safeLeaves = Array.isArray(myLeaves) ? myLeaves : [];
    const approved = safeLeaves.filter(l => l.status === "approved");
    const pending = safeLeaves.filter(l => l.status === "pending").length;
    const rejected = safeLeaves.filter(l => l.status === "rejected").length;

    const totalUsed = approved.reduce((sum, l) => sum + (l.days ?? 0), 0);
    const totalAllowed = (user as any)?.totalAllowed || 20;
    const remaining = Math.max(0, totalAllowed - totalUsed);

    return {
      totalAllowed,
      totalUsed,
      remaining,
      ratio: totalUsed / totalAllowed,
      history: {
        approved: approved.length,
        pending,
        rejected
      }
    };
  }, [myLeaves, user]);

  const overlappingTeamLeaves = useMemo(() => {
    if (!startDate || !Array.isArray(teamLeaves)) return [];

    try {
      const selectedStart = DateTime.fromISO(startDate).startOf("day");
      const selectedEnd = endDate
        ? DateTime.fromISO(endDate).endOf("day")
        : selectedStart.endOf("day");

      return teamLeaves.filter(leave => {
        if (leave.userId === user?.id) return false;

        const leaveStart = DateTime.fromISO(leave.startDate).startOf("day");
        const leaveEnd = leave.endDate
          ? DateTime.fromISO(leave.endDate).endOf("day")
          : leaveStart.plus({ days: (leave.days || 1) - 1 }).endOf("day");

        return leaveStart <= selectedEnd && leaveEnd >= selectedStart;
      });
    } catch (e) {
      return [];
    }
  }, [startDate, endDate, teamLeaves, user]);

  const leaveDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    let total = 0;
    let current = DateTime.fromISO(startDate).startOf("day");
    const end = DateTime.fromISO(endDate).startOf("day");
    const holidays: Holiday[] = holidaysData as Holiday[];

    while (current <= end) {
      const isWeekend = current.weekday >= 6;
      if (!isWeekend) {
        const holidayMatch = holidays.find(h => {
          const hStart = DateTime.fromISO(h.date).startOf("day");
          const hEnd = hStart.plus({ days: Math.ceil(h.days) - 1 }).endOf("day");
          return current >= hStart && current <= hEnd;
        });
        if (!holidayMatch) {
          total += 1;
        } else if (holidayMatch.days === 0.5 && holidayMatch.date === current.toISODate()) {
          total += 0.5;
        }
      }
      current = current.plus({ days: 1 });
    }
    return total;
  }, [startDate, endDate]);

  const validateForm = () => {
    if (!startDate || !endDate || !leaveType || !reason.trim()) {
      toast.error("Lütfen tüm alanları doldurun.");
      return false;
    }
    const start = DateTime.fromISO(startDate).startOf("day");
    const today = DateTime.now().startOf("day");
    if (start < today) {
      toast.error("Geçmiş bir tarihe izin talebi oluşturamazsınız.");
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await api.post("/leaves/add", {
        startDate,
        days: leaveDays,
        reason: leaveType,
        details: reason
      });
      
      if (response.success) {
        toast.success("İzin talebiniz başarıyla alındı!");
        setStartDate(null);
        setEndDate(null);
        setLeaveType("");
        setReason("");
      } else {
        toast.error("İzin talebi oluşturulurken bir hata oluştu.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Sunucu ile iletişim kurulamadı.");
    }
  };

  return (
    <>
      <div className="no-scrollbar cursor-default absolute top-20 bottom-20 left-72 right-8 grid grid-cols-3 grid-rows-1 gap-4">
        <DashboardCard
          title="İzin Talebi Oluştur"
          icon={<FileText className="w-7 h-7 text-blue-500" />}
          className="col-span-2 shadow-sm"
        >
          <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col gap-2">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-blue-500 focus:outline-none transition-all duration-200 font-semibold appearance-none ${leaveType === "" ? "text-gray-400" : "text-gray-700"
                      }`}
                  >
                    <option value="" disabled hidden>İzin türünü seçiniz</option>
                    <option>Yıllık İzin</option>
                    <option>Mazeret İzni</option>
                    <option>Hastalık / Rapor</option>
                    <option>Ücretsiz İzin</option>
                  </select>
                </div>

                <div className="relative flex-1">
                  <textarea
                    placeholder="İzin talebinizle ilgili bir açıklama yazınız..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={280}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-blue-500 focus:outline-none transition-all duration-200 font-semibold text-gray-700 h-full resize-none pb-8"
                  />
                  <motion.div
                    animate={reason.length === 280 ? { x: [0, -2, 2, -2, 2, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`absolute bottom-3 right-4 inline-block shrink-0 border text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap transition-colors duration-200 ${reason.length === 280
                      ? "bg-rose-100 border-rose-200 text-rose-600"
                      : "bg-gray-200 border-gray-300 text-gray-800"
                      }`}
                  >
                    {reason.length} / 280
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                </div>

                <div className="w-full p-3 bg-gray-50/80 rounded-xl border-2 border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-blue-400 shrink-0">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 leading-tight">Planlanan İzin</p>
                      <p className="text-[10px] text-blue-600 font-semibold truncate">Hafta sonu/tatil hariç</p>
                    </div>
                  </div>
                  <div className="text-base font-black text-blue-600 tabular-nums ml-2 shrink-0">
                    {leaveDays} Gün
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 shrink-0 mt-auto">
              <button
                onClick={handlePreview}
                className="py-3.5 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <Eye className="w-5 h-5 transition-transform" />
                Önizle
              </button>
              <button
                onClick={handleSubmit}
                className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <Send className="w-5 h-5" />
                Talebi Gönder
              </button>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="İzin Durumu & Özet"
          icon={<History className="w-7 h-7 text-amber-500" />}
          className="shadow-sm flex flex-col h-full overflow-hidden"
        >
          <div className="flex flex-col flex-1 overflow-hidden pr-1">
            <div className="flex flex-col gap-6 mb-6">
              <LeaveStatsOverview
                totalUsed={stats.totalUsed}
                totalAllowed={stats.totalAllowed}
                approvedCount={stats.history.approved}
                pendingCount={stats.history.pending}
                rejectedCount={stats.history.rejected}
              />
            </div>

            {startDate ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col flex-1 gap-4 pt-6 border-t border-gray-100 min-h-0"
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Users className="w-7 h-7 text-emerald-500" />
                  <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline decoration-emerald-500">
                    Ekip Durumu
                  </h2>
                </div>

                <DashboardList
                  allItems={overlappingTeamLeaves}
                  emptyText="Kimse izinli değil"
                  renderItem={(leave: any, idx: number) => {
                    const start = DateTime.fromISO(leave.startDate).setLocale("tr");
                    const end = leave.endDate
                      ? DateTime.fromISO(leave.endDate).setLocale("tr")
                      : start.plus({ days: (leave.days || 1) - 1 });

                    return (
                      <EmployeeListItem
                        key={idx}
                        firstName={leave.firstName}
                        lastName={leave.lastName}
                        primaryText={`${leave.firstName} ${leave.lastName}`}
                        secondaryText={`${start.toFormat("dd LLL")} - ${end.toFormat("dd LLL")}`}
                        badgeContent={leave.leaveType === "İzin" || !leave.leaveType ? "İzinli" : leave.leaveType}
                      />
                    );
                  }}
                />
              </motion.div>
            ) : (
              <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-center">
                <p className="text-[13px] font-bold text-gray-700">Ekip durumunu merak mı ediyorsunuz?</p>
                <p className="text-[11px] text-gray-400 font-medium">Tarih aralığı seçerek o tarihlerde kimlerin izinli olacağını görebilirsiniz.</p>
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      <LeaveDetailPopup
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="İzin Talebi Önizleme"
        leaveData={{
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          employeeName: `${user?.firstName || ""} ${user?.lastName || ""}`,
          teamName: user?.teamId ? `Takım #${user.teamId}` : "Bilinmiyor",
          startDate: startDate || DateTime.now().toISODate(),
          days: leaveDays,
          reason: leaveType || "Belirtilmedi",
          description: reason,
          status: "pending",
          createdAt: DateTime.now().toISO(),
          leaveId: 0,
        }}
        stats={{
          totalUsed: stats.totalUsed,
          totalAllowed: stats.totalAllowed,
          remaining: stats.remaining,
          pendingCount: stats.history.pending,
          approvedCount: stats.history.approved,
          rejectedCount: stats.history.rejected,
          ratio: stats.ratio,
        }}
        showActions={false}
      />
    </>);
};

export default LeaveRequestPage;
