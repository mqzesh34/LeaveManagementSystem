import {
  BadgeInfo,
  ClockArrowUp,
  FileChartColumnIncreasing,
  AlarmClockCheck,
  Palmtree,
  CalendarDays,
  History,
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
import tatiller from "../data/tatiller.json";

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
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");
  const today = now.toISODate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const result = await api.get("/leaves/dashboard-stats");
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
  }, []);

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
        leaveId: item.leaveId,
        firstName: item.firstName,
        lastName: item.lastName,
        employeeName: `${item.firstName} ${item.lastName}`,
        reason: item.reason,
        startDate: item.startDate,
        days: item.days,
      }))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );
  }, [allData]);

  const allTodayLeaves = useMemo(() => {
    return allData
      .filter((item: any) => {
        if (item.status !== "approved" || !item.startDate) return false;
        const start = DateTime.fromISO(item.startDate).startOf("day");
        const end = start.plus({ days: item.days - 1 }).endOf("day");
        return now.startOf("day") >= start && now.startOf("day") <= end;
      })
      .map((item: any) => {
        const startDt = DateTime.fromISO(item.startDate).startOf("day");
        return {
          leaveId: item.leaveId,
          firstName: item.firstName,
          lastName: item.lastName,
          employeeName: `${item.firstName} ${item.lastName}`,
          reason: item.reason,
          startDateFormatted: startDt.setLocale("tr").toFormat("dd LLL"),
          endDateFormatted: startDt
            .plus({ days: item.days - 1 })
            .setLocale("tr")
            .toFormat("dd LLL"),
          remainingDays:
            item.days -
            Math.floor(now.startOf("day").diff(startDt, "days").days),
        };
      });
  }, [allData, now]);

  const allUpcomingHolidays = useMemo(() => {
    return tatiller
      .filter((tatil: any) => DateTime.fromISO(tatil.tarih) >= now)
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.tarih).toMillis() -
          DateTime.fromISO(b.tarih).toMillis(),
      );
  }, [now]);

  const allUpcomingLeaves = useMemo(() => {
    return allData
      .filter(
        (item: any) =>
          item.status === "approved" &&
          item.leaveId &&
          DateTime.fromISO(item.startDate) >= now,
      )
      .map((item: any) => ({
        leaveId: item.leaveId,
        firstName: item.firstName,
        lastName: item.lastName,
        employeeName: `${item.firstName} ${item.lastName}`,
        startDate: item.startDate,
        days: item.days,
      }))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );
  }, [allData, now]);

  const selectedUserStats = useMemo(() => {
    if (!selectedUser) return null;

    const userLeaves = allData.filter(
      (item: any) =>
        item.userId === selectedUser.userId &&
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
      const ratio = value / (selectedUser.totalAllowed || 20);
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
  }, [selectedUser, allData]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-bold text-gray-500">
        Veriler hazırlanıyor...
      </div>
    );

  return (
    <>
      <div className="no-scrollbar cursor-default absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-4">
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
              renderItem={(user: any) => (
                <EmployeeListItem
                  key={user.userId}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  primaryText={user.employeeName}
                  badgeContent={`${user.totalLeaves} / ${user.totalAllowed} gün`}
                  onClick={() => setSelectedUser(user)}
                  extraContent={
                    <div className="w-full bg-gray-300 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          getLeaveColor(user.totalLeaves / user.totalAllowed)
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

        <div className="w-[33%] gap-4 flex flex-col">
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
              renderItem={(leave: any) => (
                <EmployeeListItem
                  key={leave.leaveId}
                  firstName={leave.firstName}
                  lastName={leave.lastName}
                  primaryText={leave.employeeName}
                  secondaryText={`${leave.reason} • ${DateTime.fromISO(
                    leave.startDate,
                  )
                    .setLocale("tr")
                    .toLocaleString(DateTime.DATE_MED)}`}
                  badgeContent={`${leave.days} gün`}
                />
              )}
            />
          </DashboardCard>

          <DashboardCard
            title="Bugün İzinde Olanlar"
            icon={<Palmtree className="w-7 h-7 text-fuchsia-700" />}
            viewAllPath={`/calendar?date=${today}&view=timeGridDay`}
            buttonText="Bugünü Takvimde Aç"
            className="flex-1"
          >
            <DashboardList
              allItems={allTodayLeaves}
              loading={loading}
              renderItem={(leave: any, index: number) => (
                <EmployeeListItem
                  key={`${leave.leaveId}-${index}`}
                  firstName={leave.firstName}
                  lastName={leave.lastName}
                  primaryText={leave.employeeName}
                  secondaryText={`${leave.reason} • ${leave.startDateFormatted} - ${leave.endDateFormatted}`}
                  badgeContent={`${leave.remainingDays} gün`}
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
                  .map((tatil: any, index: number) => (
                    <EmployeeListItem
                      key={index}
                      primaryText={tatil.ad}
                      secondaryText={DateTime.fromISO(tatil.tarih)
                        .setLocale("tr")
                        .toLocaleString(DateTime.DATE_FULL)}
                      badgeContent={`${tatil.gun_sayisi} gün`}
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
              renderItem={(leave: any, index: number) => (
                <EmployeeListItem
                  key={index}
                  firstName={leave.firstName}
                  lastName={leave.lastName}
                  primaryText={leave.employeeName}
                  secondaryText={DateTime.fromISO(leave.startDate)
                    .setLocale("tr")
                    .toLocaleString(DateTime.DATE_FULL)}
                  badgeContent={`${leave.days} gün`}
                />
              )}
            />
          </DashboardCard>
        </div>
      </div>

      <Popup
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Kullanıcı İzin Detayları"
      >
        {selectedUser && selectedUserStats && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-gray-200 border-2 p-4 rounded-xl">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.firstName}%${selectedUser.lastName}`}
                alt={selectedUser.employeeName}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedUser.employeeName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold  bg-gray-200 border text-gray-800 px-2 py-0.5 rounded-full ">
                    {selectedUser.totalLeaves} Gün İzin Kullanıldı
                  </span>
                  {(() => {
                    const status = getLeaveColor(
                      selectedUser.totalLeaves / selectedUser.totalAllowed,
                    );
                    return (
                      <span
                        className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${status.text} ${status.bg} ${status.border}`}
                      >
                        {" "}
                        {selectedUser.totalLeaves - selectedUser.totalAllowed <=
                        0
                          ? `${selectedUser.totalAllowed - selectedUser.totalLeaves} Gün İzin Hakkı Kaldı`
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
                    <BarChart data={selectedUserStats.chartData}>
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
                        {selectedUserStats.chartData.map(
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
                  {selectedUserStats.history.length > 0 ? (
                    selectedUserStats.history.map((leave: any, i: number) => (
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
    </>
  );
};

export default MainPage;
