import {
  BadgeInfo,
  ClockArrowUp,
  FileChartColumnIncreasing,
  AlarmClockCheck,
  Palmtree,
  CalendarDays,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState, useMemo } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

import { api } from "../services/api";
import DashboardCard from "../components/DashboardCard";
import DashboardList from "../components/DashboardList";
import EmployeeListItem from "../components/EmployeeListItem";
import Popup from "../components/Popup";
import LeaveDetailPopup from "../components/LeaveDetailPopup";
import holidays from "../data/holidays.json";
import { formatLeaveItem } from "../utils/leaveUtils";
import { useAuth } from "../context/authContext";

const getLeaveColor = (ratio: number) => {
  if (ratio >= 0.75) {
    return {
      hex: "#f43f5e",
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-600",
      bar: "bg-rose-500",
    };
  }
  if (ratio >= 0.5) {
    return {
      hex: "#f59e0b",
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-600",
      bar: "bg-amber-500",
    };
  }
  return {
    hex: "#10b981",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-600",
    bar: "bg-emerald-500",
  };
};

const MainPage = () => {
  const [allData, setAllData] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [teamView, setTeamView] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topLeaversPopup, setTopLeaversPopup] = useState<any>(null);
  const [selectedLeavePopup, setSelectedLeavePopup] = useState<any>(null);
  const { user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const fetchDashboardData = async () => {
      try {
        const result = await api.get("/leaves/admin-view");
        if (result.success) {
          setAllData(result.data);
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isAdmin]);

  useEffect(() => {
    const fetchTeamView = async () => {
      try {
        const result = await api.get("/leaves/team-view");
        if (result.success) {
          setTeamView(result.data);
        }
      } catch (error) {
        console.error("Ekip verisi alınamadı:", error);
      }
    };
    fetchTeamView();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      const fetchMyLeaves = async () => {
        try {
          const result = await api.get("/leaves/my");
          if (result.success) {
            setMyLeaves(result.data);
          }
        } catch (error) {
          console.error("Kişisel izin verisi alınamadı:", error);
        }
      };
      fetchMyLeaves();
    }
  }, [isAdmin]);

  const { stats, chartData } = useMemo(() => {
    const leavesOnly = allData.filter((item: any) => item.leaveId);
    const approved = leavesOnly.filter(
      (l: any) => l.status === "approved",
    ).length;
    const rejected = leavesOnly.filter(
      (l: any) => l.status === "rejected",
    ).length;
    const pending = leavesOnly.filter(
      (l: any) => l.status === "pending",
    ).length;

    return {
      stats: {
        approved,
        rejected,
        pending,
        total: approved + rejected + pending,
      },
      chartData: [
        { name: "Onaylandı", value: approved, fill: "#10b981" },
        { name: "Reddedildi", value: rejected, fill: "#f43f5e" },
        { name: "Bekliyor", value: pending, fill: "#f59e0b" },
      ],
    };
  }, [allData]);

  const allTopLeaveUsers = useMemo(() => {
    const userMap: Record<string, any> = {};
    allData.forEach((item: any) => {
      if (!userMap[item.userId]) {
        userMap[item.userId] = {
          userId: item.userId,
          firstName: item.firstName,
          lastName: item.lastName,
          employeeName: `${item.firstName} ${item.lastName}`,
          totalLeaves: 0,
          totalAllowed: item.totalAllowed || 20,
        };
      }
      if (item.status === "approved" && item.leaveId) {
        userMap[item.userId].totalLeaves += item.days;
      }
    });
    return Object.values(userMap)
      .filter((u: any) => u.totalLeaves > 0)
      .sort((a: any, b: any) => b.totalLeaves - a.totalLeaves);
  }, [allData]);

  const allPendingLeaves = useMemo(() => {
    return allData
      .filter((item: any) => item.status === "pending" && item.leaveId)
      .map((item: any) => ({
        ...formatLeaveItem(item, now),
        department: item.department,
        totalAllowed: item.totalAllowed,
      }))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );
  }, [allData]);

  const allTodayLeaves = useMemo(() => {
    return teamView
      .filter((item: any) => {
        if (!item.startDate) return false;
        const start = DateTime.fromISO(item.startDate).startOf("day");
        const end = start.plus({ days: item.days - 1 }).endOf("day");
        return now.startOf("day") >= start && now.startOf("day") <= end;
      })
      .map((item: any) => formatLeaveItem(item, now));
  }, [teamView, now]);

  const allUpcomingHolidays = useMemo(() => {
    return holidays
      .filter((holiday: any) => DateTime.fromISO(holiday.date).startOf("day") >= now.startOf("day"))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.date).toMillis() -
          DateTime.fromISO(b.date).toMillis(),
      );
  }, [now]);

  const allUpcomingLeaves = useMemo(() => {
    return teamView
      .filter((item: any) => DateTime.fromISO(item.startDate).startOf("day") > now.startOf("day") && String(item.userId) !== String(user?.id))
      .map((item: any) => formatLeaveItem(item, now))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );
  }, [teamView, now]);

  const myLeaveStats = useMemo(() => {
    const totalAllowed = myLeaves[0]?.totalAllowed ?? 20;
    const approved = myLeaves
      .filter((l: any) => l.status === "approved")
      .reduce((sum: number, l: any) => sum + (l.days ?? 0), 0);
    const pending = myLeaves.filter((l: any) => l.status === "pending").length;
    const ratio = approved / totalAllowed;

    const upcomingMyLeaves = myLeaves
      .filter(
        (l: any) =>
          l.status === "approved" && DateTime.fromISO(l.startDate).startOf("day") >= now.startOf("day"),
      )
      .map((item: any) => formatLeaveItem(item, now))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );

    const myLeavesHistory = myLeaves
      .filter((l: any) => DateTime.fromISO(l.startDate) < now)
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(b.startDate).toMillis() -
          DateTime.fromISO(a.startDate).toMillis(),
      );

    return {
      totalAllowed,
      approved,
      pending,
      ratio,
      upcomingMyLeaves,
      myLeavesHistory,
    };
  }, [myLeaves, now]);

  const topLeaversPopupStats = useMemo(() => {
    if (!topLeaversPopup) return null;

    const userLeaves = allData.filter(
      (item: any) =>
        item.userId === topLeaversPopup.userId &&
        item.status === "approved" &&
        item.leaveId,
    );

    const monthlyData: Record<string, number> = {
      Ocak: 0,
      Şubat: 0,
      Mart: 0,
      Nisan: 0,
      Mayıs: 0,
      Haziran: 0,
      Temmuz: 0,
      Ağustos: 0,
      Eylül: 0,
      Ekim: 0,
      Kasım: 0,
      Aralık: 0,
    };

    userLeaves.forEach((leave) => {
      const month = DateTime.fromISO(leave.startDate)
        .setLocale("tr")
        .toFormat("LLLL");
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
      if (monthlyData[capitalizedMonth] !== undefined) {
        monthlyData[capitalizedMonth] += leave.days;
      }
    });

    const chartData = Object.entries(monthlyData).map(([name, value]) => {
      const ratio = value / (topLeaversPopup.totalAllowed || 20);
      return {
        name,
        days: value,
        fill: getLeaveColor(ratio).hex,
      };
    });

    return {
      history: userLeaves.sort(
        (a, b) =>
          DateTime.fromISO(b.startDate).toMillis() -
          DateTime.fromISO(a.startDate).toMillis(),
      ),
      chartData,
    };
  }, [topLeaversPopup, allData]);

  const selectedLeaveStats = useMemo(() => {
    if (!selectedLeavePopup) return null;

    const userLeaves = allData.filter(
      (item: any) =>
        item.userId === selectedLeavePopup.userId && item.leaveId,
    );

    const totalUsed = userLeaves
      .filter((l: any) => l.status === "approved")
      .reduce((sum: number, l: any) => sum + (l.days ?? 0), 0);

    const totalAllowed = selectedLeavePopup.totalAllowed || 20;
    const remaining = Math.max(0, totalAllowed - totalUsed);
    const pendingCount = userLeaves.filter((l: any) => l.status === "pending").length;
    const approvedCount = userLeaves.filter((l: any) => l.status === "approved").length;
    const rejectedCount = userLeaves.filter((l: any) => l.status === "rejected").length;

    return {
      totalUsed,
      totalAllowed,
      remaining,
      pendingCount,
      approvedCount,
      rejectedCount,
      ratio: totalUsed / totalAllowed,
    };
  }, [selectedLeavePopup, allData]);

  const handleApproveLeave = async (id: number) => {
    const result = await api.put(`/leaves/approve/${id}`);
    if (result.success) {
      setAllData(allData.map((item: any) =>
        item.leaveId === id ? { ...item, status: "approved" } : item,
      ));

      const approvedLeave = allData.find((item: any) => item.leaveId === id);
      if (approvedLeave) {
        setTeamView([...teamView, { ...approvedLeave, status: "approved" }]);
      }
    }
  };

  const handleRejectLeave = async (id: number) => {
    const result = await api.put(`/leaves/reject/${id}`);
    if (result.success) {
      setAllData(allData.map((item: any) =>
        item.leaveId === id ? { ...item, status: "rejected" } : item,
      ));
      setTeamView(teamView.filter((item: any) => item.leaveId !== id));
    }
  };


  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-bold text-gray-500">
        Veriler hazırlanıyor...
      </div>
    );

  return (
    <>
      <div className="no-scrollbar cursor-default absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-4">
        {isAdmin && (
          <DashboardCard
            title="İstatistikler"
            icon={
              <FileChartColumnIncreasing className="w-7 h-7 text-amber-500" />
            }
            className="w-[33%]"
          >
            <div className="flex flex-col w-full flex-1 min-h-0">
              <div className="flex flex-row items-center w-full justify-between gap-4 shrink-0 min-w-0 h-47.5">
                <div className="relative w-40 h-40 shrink-0 non-select select-none pointer-events-none focus:outline-none">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    className="non-select select-none"
                  >
                    <PieChart
                      className="non-select select-none focus:outline-none"
                      style={{ outline: "none" }}
                    >
                      <Pie
                        data={chartData}
                        innerRadius="80%"
                        outerRadius="100%"
                        cornerRadius={6}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                    <span className="text-4xl font-bold text-gray-800">
                      {stats.total}
                    </span>
                    <span className="text-[11px] text-gray-500 font-bold tracking-tight">
                      Toplam İstek
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4 flex-1 min-w-0 h-full overflow-y-auto no-scrollbar pl-2">
                  {chartData.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between min-w-0"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                      <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-1">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-[50%] h-1 mx-auto my-6 rounded-full bg-gray-200 shrink-0"></div>

              <div className="flex items-center justify-center gap-2 mb-3 shrink-0">
                <h2 className="text-xl truncate font-bold text-gray-800">
                  - En Çok İzin Kullanan Çalışanlar -
                </h2>
              </div>

              <DashboardList
                allItems={allTopLeaveUsers}
                loading={loading}
                emptyText="Henüz onaylanan izin bulunmuyor."
                renderItem={(user: any) => (
                  <EmployeeListItem
                    key={user.userId}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    primaryText={user.employeeName}
                    badgeContent={`${user.totalLeaves} / ${user.totalAllowed} gün`}
                    onClick={() => setTopLeaversPopup(user)}
                    extraContent={
                      <div className="w-full bg-gray-300 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${getLeaveColor(user.totalLeaves / user.totalAllowed)
                            .bar
                            }`}
                          style={{
                            width: `${Math.min(
                              (user.totalLeaves / user.totalAllowed) * 100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    }
                  />
                )}
              />
            </div>
          </DashboardCard>
        )}

        {!isAdmin && user && (
          <DashboardCard
            title="Profil Bilgilerim"
            icon={
              <FileChartColumnIncreasing className="w-7 h-7 text-indigo-500" />
            }
            className="w-[33%] h-full"
          >
            <div className="flex flex-col w-full flex-1 min-h-0 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%${user.lastName}`}
                  alt="Profil"
                  className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-800 truncate">
                    {`${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}`}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.email ?? ""}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-gray-200 shrink-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  İzin Durumu
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800">
                      {myLeaveStats.approved}
                    </span>{" "}
                    / {myLeaveStats.totalAllowed} gün kullanıldı
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getLeaveColor(myLeaveStats.ratio).text
                      } ${getLeaveColor(myLeaveStats.ratio).bg} ${getLeaveColor(myLeaveStats.ratio).border}`}
                  >
                    {myLeaveStats.totalAllowed - myLeaveStats.approved > 0
                      ? `${myLeaveStats.totalAllowed - myLeaveStats.approved} gün kaldı`
                      : "Hak kalmadı"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getLeaveColor(myLeaveStats.ratio).bar}`}
                    style={{
                      width: `${Math.min(myLeaveStats.ratio * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1 shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  İzin Geçmişim
                </h2>
              </div>
              <DashboardList
                allItems={myLeaveStats.myLeavesHistory}
                loading={loading}
                emptyText="Henüz kullanılan izin bulunmuyor."
                disableLimit={true}
                renderItem={(leave: any) => (
                  <EmployeeListItem
                    key={leave.id ?? leave.leaveId}
                    primaryText={leave.reason ?? "İzin"}
                    secondaryText={DateTime.fromISO(leave.startDate)
                      .setLocale("tr")
                      .toLocaleString(DateTime.DATE_MED)}
                    badgeContent={`${leave.days} gün`}
                    icon={
                      leave.status === "pending" || leave.status === "rejected" ? (
                        <XCircle className="w-8 h-8 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      )
                    }
                  />
                )}
              />
            </div>
          </DashboardCard>
        )}

        <div className="w-[33%] gap-4 flex flex-col">
          {isAdmin && (
            <DashboardCard
              title="Onay Bekleyen İzinler"
              icon={<AlarmClockCheck className="w-7 h-7 text-rose-600" />}
              viewAllPath="/management"
              buttonText="İzinleri Yönet"
              className="flex-1"
            >
              <DashboardList
                allItems={allPendingLeaves}
                loading={loading}
                emptyText="Bekleyen izin talebi bulunmuyor."
                renderItem={(leave: any) => (
                  <EmployeeListItem
                    key={leave.leaveId}
                    firstName={leave.firstName}
                    lastName={leave.lastName}
                    primaryText={leave.employeeName}
                    secondaryText={leave.formattedSecondaryText}
                    badgeContent={leave.formattedBadgeContent}
                    onClick={() => setSelectedLeavePopup(leave)}
                  />
                )}
              />
            </DashboardCard>
          )}
          {!isAdmin && (
            <DashboardCard
              title="Yaklaşan Onaylanmış İzinlerim"
              icon={<ClockArrowUp className="w-7 h-7 text-indigo-500" />}
              className="flex-1"
            >
              <DashboardList
                allItems={myLeaveStats.upcomingMyLeaves}
                loading={loading}
                emptyText="Yaklaşan onaylı izin bulunmuyor."
                renderItem={(leave: any) => (
                  <EmployeeListItem
                    key={leave.id ?? leave.leaveId}
                    primaryText={leave.reason ?? "İzin"}
                    secondaryText={leave.formattedSecondaryText}
                    badgeContent={leave.formattedBadgeContent}
                    onClick={() => setSelectedLeavePopup(leave)}
                  />
                )}
              />
            </DashboardCard>
          )}
          <DashboardCard
            title="Bugün İzinde Olan Çalışanlar"
            icon={<Palmtree className="w-7 h-7 text-fuchsia-700" />}
            className="flex-1"
          >
            <DashboardList
              allItems={allTodayLeaves}
              loading={loading}
              emptyText="Bugün izinde olan çalışan yok."
              renderItem={(leave: any, index: number) => (
                <EmployeeListItem
                  key={`${leave.leaveId}-${index}`}
                  firstName={leave.firstName}
                  lastName={leave.lastName}
                  primaryText={leave.employeeName}
                  secondaryText={leave.formattedSecondaryText}
                  badgeContent={leave.remainingDaysBadge}
                  onClick={() => setSelectedLeavePopup(leave)}
                />
              )}
            />
          </DashboardCard>
        </div>

        <div className="w-[33%] gap-4 flex flex-col">
          <DashboardCard
            title="Yaklaşan Resmi Tatiller"
            icon={<BadgeInfo className="w-7 h-7 text-blue-500" />}
            viewAllPath="/calendar?mode=holidays"
            buttonText="Resmi Tatilleri Görüntüle"
            className="shrink-0"
          >
            <div className="flex-1 min-h-0 relative">
              <div className="space-y-2 h-full overflow-y-auto no-scrollbar">
                {allUpcomingHolidays
                  .slice(0, 3)
                  .map((holiday: any, index: number) => (
                    <EmployeeListItem
                      key={index}
                      primaryText={holiday.name}
                      secondaryText={DateTime.fromISO(holiday.date)
                        .setLocale("tr")
                        .toLocaleString(DateTime.DATE_FULL)}
                      badgeContent={`${holiday.days} gün`}
                    />
                  ))}
              </div>
              {allUpcomingHolidays.length <= 3 &&
                allUpcomingHolidays.length > 0 && (
                  <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-400 italic pointer-events-none">
                    - Daha fazla kayıt yok -
                  </p>
                )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Yaklaşan İzinler"
            icon={<ClockArrowUp className="w-7 h-7 text-emerald-500" />}
            className="flex-1"
          >
            <DashboardList
              allItems={allUpcomingLeaves}
              loading={loading}
              emptyText="Yaklaşan onaylı izin bulunmuyor."
              renderItem={(leave: any, index: number) => (
                <EmployeeListItem
                  key={`${leave.leaveId || index}`}
                  firstName={leave.firstName}
                  lastName={leave.lastName}
                  primaryText={leave.employeeName}
                  secondaryText={leave.formattedSecondaryText}
                  badgeContent={leave.formattedBadgeContent}
                  onClick={() => setSelectedLeavePopup(leave)}
                />
              )}
            />
          </DashboardCard>
        </div>
      </div>

      <Popup
        isOpen={!!topLeaversPopup}
        onClose={() => setTopLeaversPopup(null)}
        title="Kullanıcı İzin Detayları"
      >
        {topLeaversPopup && topLeaversPopupStats && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-gray-200 border-2 p-4 rounded-xl">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${topLeaversPopup.firstName}%${topLeaversPopup.lastName}`}
                alt={topLeaversPopup.employeeName}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {topLeaversPopup.employeeName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold  bg-gray-200 border text-gray-800 px-2 py-0.5 rounded-full ">
                    {topLeaversPopup.totalLeaves} Gün İzin Kullanıldı
                  </span>
                  {(() => {
                    const status = getLeaveColor(
                      topLeaversPopup.totalLeaves / topLeaversPopup.totalAllowed,
                    );
                    return (
                      <span
                        className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${status.text} ${status.bg} ${status.border}`}
                      >
                        {" "}
                        {topLeaversPopup.totalLeaves - topLeaversPopup.totalAllowed <=
                          0
                          ? `${topLeaversPopup.totalAllowed - topLeaversPopup.totalLeaves} Gün İzin Hakkı Kaldı`
                          : "Kullanacak İzin Hakkı Kalmadı"}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4  border-gray-200 border-2 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Aylık Dağılım
                  </span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLeaversPopupStats.chartData}>
                      <Tooltip
                        cursor={{ fill: "#f3f4f6" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="days"
                        radius={[4, 4, 0, 0]}
                        name="İzin Günü"
                      >
                        {topLeaversPopupStats.chartData.map(
                          (entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ),
                        )}
                      </Bar>
                      <XAxis
                        dataKey="name"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4  border-gray-200 border-2 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <History className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    İzin Geçmişi
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-48 no-scrollbar space-y-2">
                  {topLeaversPopupStats.history.length > 0 ? (
                    topLeaversPopupStats.history.map((leave: any, i: number) => (
                      <EmployeeListItem
                        key={i}
                        primaryText={leave.reason}
                        secondaryText={DateTime.fromISO(leave.startDate)
                          .setLocale("tr")
                          .toLocaleString(DateTime.DATE_MED)}
                        badgeContent={`${leave.days} gün`}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      Kayıt bulunamadı.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Popup>

      <LeaveDetailPopup
        isOpen={!!selectedLeavePopup}
        onClose={() => setSelectedLeavePopup(null)}
        title={selectedLeavePopup?.status === "pending" ? "İzin Talebi Detayları" : "İzin Detayları"}
        leaveData={selectedLeavePopup}
        stats={selectedLeaveStats}
        showActions={selectedLeavePopup?.status === "pending"}
        onApprove={handleApproveLeave}
        onReject={handleRejectLeave}
      />
    </>
  );
};

export default MainPage;
