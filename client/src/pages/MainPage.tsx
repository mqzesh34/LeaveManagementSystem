import Sidebar from "../components/Sidebar";
import ViewAllButton from "../components/ViewAllButton";
import tatiller from "../data/tatiller.json";
import { useAuth } from "../context/authContext";
import {
  BadgeInfo,
  ClockArrowUp,
  FileChartColumnIncreasing,
  AlarmClockCheck,
  Palmtree,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState, useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

import { api } from "../services/api";

const MainPage = () => {
  const { user: currentUser } = useAuth();
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [holidayCount, setHolidayCount] = useState(1);
  const [leaveCount, setLeaveCount] = useState(1);
  const [pendingCount, setPendingCount] = useState(1);
  const [todayLeaveCount, setTodayLeaveCount] = useState(1);
  const [topLeaveUsersCount, setTopLeaveUsersCount] = useState(1);

  const holidaysRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  const todayLeaveRef = useRef<HTMLDivElement>(null);
  const topLeaveUsersRef = useRef<HTMLDivElement>(null);

  const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");
  const today = new Date().toISOString().split("T")[0];

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
          id: item.userId,
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
        employeeName: `${item.firstName} ${item.lastName}`,
        firstName: item.firstName,
        lastName: item.lastName,
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
          employeeName: `${item.firstName} ${item.lastName}`,
          firstName: item.firstName,
          lastName: item.lastName,
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
        employeeName: `${item.firstName} ${item.lastName}`,
        firstName: item.firstName,
        lastName: item.lastName,
        startDate: item.startDate,
        days: item.days,
      }))
      .sort(
        (a: any, b: any) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis(),
      );
  }, [allData, now]);

  const topLeaveUsers = allTopLeaveUsers.slice(0, topLeaveUsersCount);
  const pendingLeaves = allPendingLeaves.slice(0, pendingCount);
  const todayLeaves = allTodayLeaves.slice(0, todayLeaveCount);
  const upcomingHolidays = allUpcomingHolidays.slice(0, holidayCount);
  const upcomingLeaves = allUpcomingLeaves.slice(0, leaveCount);

  useEffect(() => {
    const calculateCounts = () => {
      const isZoomed = window.innerWidth >= 1600;
      const isUnzoomed = window.innerWidth <= 1200;
      const itemHeight = isZoomed ? 66 : isUnzoomed ? 54 : 60;

      const getCount = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return 1;
        const height = ref.current.getBoundingClientRect().height;
        return Math.max(1, Math.floor((height - 5) / itemHeight));
      };

      setHolidayCount(getCount(holidaysRef));
      setLeaveCount(getCount(leavesRef));
      setPendingCount(getCount(pendingRef));
      setTodayLeaveCount(getCount(todayLeaveRef));
      setTopLeaveUsersCount(getCount(topLeaveUsersRef));
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(calculateCounts);
    });

    const refs = [
      holidaysRef,
      leavesRef,
      pendingRef,
      todayLeaveRef,
      topLeaveUsersRef,
    ];
    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    calculateCounts();
    return () => observer.disconnect();
  }, [loading]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-bold text-gray-500">
        Veriler hazırlanıyor...
      </div>
    );

  if (!currentUser && false) console.log(currentUser);
  return (
    <>
      <Sidebar />
      <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-4">
        <div className="w-[33%] p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <FileChartColumnIncreasing className="w-7 h-7 text-amber-500" />
            <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
              İstatistikler
            </h2>
          </div>
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
            <div
              ref={topLeaveUsersRef}
              className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar"
            >
              {topLeaveUsers.slice(0, topLeaveUsersCount).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%${user.lastName}`}
                      alt={user.employeeName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-md font-semibold text-gray-800 truncate">
                        {user.employeeName}
                      </p>
                      <div className="w-full bg-gray-300 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (user.totalLeaves / user.totalAllowed) * 100,
                              100,
                            )}%`,
                            backgroundColor:
                              user.totalLeaves / user.totalAllowed >= 0.75
                                ? "#f43f5e"
                                : user.totalLeaves / user.totalAllowed >= 0.5
                                  ? "#f59e0b"
                                  : "#10b981",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-2 shrink-0">
                    <span className="inline-block bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                      {user.totalLeaves} / {user.totalAllowed} gün
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[33%] gap-4 flex flex-col">
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <AlarmClockCheck className="w-7 h-7 text-rose-600" />
              <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
                Onay Bekleyen İzinler
              </h2>
            </div>
            <div
              ref={pendingRef}
              className="space-y-2 flex-1 min-h-0  overflow-y-auto no-scrollbar"
            >
              {pendingLeaves.slice(0, pendingCount).map((leave) => (
                <div
                  key={leave.leaveId}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${leave.firstName}%${leave.lastName}`}
                      alt={leave.employeeName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-md font-semibold truncate text-gray-800">
                        {leave.employeeName}
                      </p>
                      <p className="text-xs truncate text-gray-500">
                        {leave.reason} •{" "}
                        {DateTime.fromISO(leave.startDate)
                          .setLocale("tr")
                          .toLocaleString(DateTime.DATE_MED)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {leave.days} gün
                  </span>
                </div>
              ))}
            </div>

            <ViewAllButton label="İzin yönetim" path="/leaves" />
          </div>
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Palmtree className="w-7 h-7 text-fuchsia-700" />
              <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
                Bugün İzinde Olanlar
              </h2>
            </div>

            <div
              ref={todayLeaveRef}
              className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar"
            >
              {todayLeaves.slice(0, todayLeaveCount).map((leave, index) => (
                <div
                  key={`${leave.leaveId}-${index}`}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${leave.firstName}%${leave.lastName}`}
                      alt={leave.employeeName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-md font-semibold text-gray-800 truncate">
                        {leave.employeeName}
                      </p>
                      <p className="text-xs truncate text-gray-500">
                        {leave.reason} • {leave.startDateFormatted} -{" "}
                        {leave.endDateFormatted}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {leave.remainingDays} gün
                  </span>
                </div>
              ))}
            </div>

            <ViewAllButton
              label="Takvim"
              path={`/calendar?date=${today}&view=timeGridDay`}
            />
          </div>
        </div>
        <div className="w-[33%]  gap-4 flex flex-col">
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <BadgeInfo className="w-7 h-7 text-blue-500" />
              <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
                Yaklaşan Resmi Tatiller
              </h2>
            </div>

            <div
              ref={holidaysRef}
              className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar"
            >
              {upcomingHolidays.slice(0, holidayCount).map((tatil, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-md font-semibold text-gray-800 truncate">
                      {tatil.ad}
                    </p>
                    <p className="text-xs truncate text-gray-500">
                      {DateTime.fromISO(tatil.tarih)
                        .setLocale("tr")
                        .toLocaleString(DateTime.DATE_FULL)}
                    </p>
                  </div>
                  <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {tatil.gun_sayisi} gün
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <ClockArrowUp className="w-7 h-7 text-emerald-500" />
              <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
                Yaklaşan İzinler
              </h2>
            </div>

            <div
              ref={leavesRef}
              className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar"
            >
              {upcomingLeaves.slice(0, leaveCount).map((leave, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${leave.firstName}%${leave.lastName}`}
                      alt={leave.employeeName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-md font-semibold text-gray-800 truncate">
                        {leave.employeeName}
                      </p>
                      <p className="text-xs truncate text-gray-500">
                        {DateTime.fromISO(leave.startDate)
                          .setLocale("tr")
                          .toLocaleString(DateTime.DATE_FULL)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {leave.days} gün
                  </span>
                </div>
              ))}
            </div>

            <ViewAllButton label="Takvim" path="/calendar" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
