import Sidebar from "../components/Sidebar";
import ViewAllButton from "../components/ViewAllButton";
import mockUsers from "../data/mockUsers.json";
import tatiller from "../data/tatiller.json";
import {
  BadgeInfo,
  ClockArrowUp,
  Users,
  AlarmClockCheck,
  Palmtree,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";

const MainPage = () => {
  const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");

  // --- AI Eklentisi Başlangıcı: Ekran boyutuna göre liste elemanı sayısını hesaplama ---
  const [employeeCount, setEmployeeCount] = useState(8);
  const [holidayCount, setHolidayCount] = useState(3);
  const [leaveCount, setLeaveCount] = useState(3);
  const [pendingCount, setPendingCount] = useState(3);
  const [todayLeaveCount, setTodayLeaveCount] = useState(3);

  const employeesRef = useRef<HTMLDivElement>(null);
  const holidaysRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  const todayLeaveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Kutunun mevcut yüksekliğine göre sığabilecek eleman sayısının hesaplanması:
        // Eğer ekran 1600px veya daha büyükse, CSS tarafında zoom %110 olduğu için
        // elemanların gerçek yüksekliği de oransal olarak (~66px) artmaktadır.
        const isZoomed =
          typeof window !== "undefined" && window.innerWidth >= 1600;
        const itemHeight = isZoomed ? 66 : 60; // 60px * 1.1
        const height = entry.contentRect.height;
        const count = Math.max(1, Math.floor((height + 8) / itemHeight));

        if (entry.target === employeesRef.current) {
          setEmployeeCount(count);
        } else if (entry.target === holidaysRef.current) {
          setHolidayCount(count);
        } else if (entry.target === leavesRef.current) {
          setLeaveCount(count);
        } else if (entry.target === pendingRef.current) {
          setPendingCount(count);
        } else if (entry.target === todayLeaveRef.current) {
          setTodayLeaveCount(count);
        }
      }
    });

    if (employeesRef.current) observer.observe(employeesRef.current);
    if (holidaysRef.current) observer.observe(holidaysRef.current);
    if (leavesRef.current) observer.observe(leavesRef.current);
    if (pendingRef.current) observer.observe(pendingRef.current);
    if (todayLeaveRef.current) observer.observe(todayLeaveRef.current);

    return () => observer.disconnect();
  }, []);
  // --- AI Eklentisi Sonu ---

  return (
    <>
      <Sidebar />
      <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-4">
        <div className="w-[33%] h-full p-6  rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center  gap-2 mb-3">
            <Users className="w-7 h-7 text-gray-800" />
            <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
              Çalışanlar
            </h2>
          </div>

          <div
            ref={employeesRef}
            className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar"
          >
            {mockUsers.users
              .filter((user) => user.role === "Çalışan")
              .slice(0, employeeCount)
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%${user.lastName}`}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-md font-semibold text-gray-800 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <ViewAllButton label="Çalışanlara" path="/employees" />
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
              {mockUsers.users
                .flatMap((user) =>
                  (user.leaves || [])
                    .filter((leave) => leave.status === "pending")
                    .map((leave) => ({
                      leaveId: leave.id,
                      userId: user.id,
                      employeeName: `${user.firstName} ${user.lastName}`,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      startDate: leave.startDate,
                      days: leave.days,
                      reason: leave.reason,
                    })),
                )
                .sort(
                  (a, b) =>
                    DateTime.fromISO(a.startDate).toMillis() -
                    DateTime.fromISO(b.startDate).toMillis(),
                )
                .slice(0, pendingCount)
                .map((leave) => (
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
                    <span className="inline-block flex-shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
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
              {mockUsers.users
                .flatMap((user) =>
                  (user.leaves || [])
                    .filter((leave) => {
                      if (leave.status !== "approved") return false;
                      const start = DateTime.fromISO(leave.startDate).startOf(
                        "day",
                      );
                      const end = start
                        .plus({ days: leave.days - 1 })
                        .endOf("day");
                      const today = now.startOf("day");
                      return today >= start && today <= end;
                    })
                    .map((leave) => {
                      const startDt = DateTime.fromISO(leave.startDate).startOf(
                        "day",
                      );
                      const endDt = startDt
                        .plus({ days: leave.days - 1 })
                        .endOf("day");
                      const today = now.startOf("day");
                      const diffDays = Math.floor(
                        today.diff(startDt, "days").days,
                      );
                      const remainingDays = leave.days - diffDays;

                      return {
                        leaveId: leave.id,
                        userId: user.id,
                        employeeName: `${user.firstName} ${user.lastName}`,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        reason: leave.reason,
                        startDateFormatted: startDt
                          .setLocale("tr")
                          .toFormat("dd LLL"),
                        endDateFormatted: endDt
                          .setLocale("tr")
                          .toFormat("dd LLL"),
                        remainingDays: remainingDays,
                      };
                    }),
                )
                .slice(0, todayLeaveCount)
                .map((leave, index) => (
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
                    <span className="inline-block flex-shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {leave.remainingDays} gün
                    </span>
                  </div>
                ))}
            </div>

            <ViewAllButton label="Tümünü" path="/leaves" />
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
              {tatiller
                .filter((tatil) => DateTime.fromISO(tatil.tarih) >= now)
                .sort(
                  (a, b) =>
                    DateTime.fromISO(a.tarih).toMillis() -
                    DateTime.fromISO(b.tarih).toMillis(),
                )
                .slice(0, holidayCount)
                .map((tatil, index) => (
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
                    <span className="inline-block flex-shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {tatil.gun_sayisi} gün
                    </span>
                  </div>
                ))}
            </div>

            <ViewAllButton label="Takvime" path="/calendar" />
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
              {mockUsers.users
                .flatMap((user) =>
                  (user.leaves || [])
                    .filter((leave) => leave.status === "approved")
                    .map((leave) => ({
                      userId: user.id,
                      employeeName: `${user.firstName} ${user.lastName}`,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      startDate: leave.startDate,
                      days: leave.days,
                      reason: leave.reason,
                    })),
                )
                .filter((leave) => DateTime.fromISO(leave.startDate) >= now)
                .sort(
                  (a, b) =>
                    DateTime.fromISO(a.startDate).toMillis() -
                    DateTime.fromISO(b.startDate).toMillis(),
                )
                .slice(0, leaveCount)
                .map((leave, index) => (
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
                    <span className="inline-block flex-shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {leave.days} gün
                    </span>
                  </div>
                ))}
            </div>

            <ViewAllButton label="Takvime" path="/calendar" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
