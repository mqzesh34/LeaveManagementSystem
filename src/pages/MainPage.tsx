import Sidebar from "../components/Sidebar";
import ViewAllButton from "../components/ViewAllButton";
import mockUsers from "../data/mockUsers.json";
import tatiller from "../data/tatiller.json";
import { BadgeInfo, ClockArrowUp, Users } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";

const MainPage = () => {
  const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");

  // --- AI Eklentisi Başlangıcı: Ekran boyutuna göre liste elemanı sayısını hesaplama ---
  const [employeeCount, setEmployeeCount] = useState(8);
  const [holidayCount, setHolidayCount] = useState(3);
  const [leaveCount, setLeaveCount] = useState(3);

  const employeesRef = useRef<HTMLDivElement>(null);
  const holidaysRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Kutunun mevcut yüksekliğine göre sığabilecek eleman sayısının hesaplanması (yaklaşık her bir eleman + boşluk = 60px)
        const height = entry.contentRect.height;
        const count = Math.max(1, Math.floor((height + 8) / 60));
        
        if (entry.target === employeesRef.current) {
          setEmployeeCount(count);
        } else if (entry.target === holidaysRef.current) {
          setHolidayCount(count);
        } else if (entry.target === leavesRef.current) {
          setLeaveCount(count);
        }
      }
    });

    if (employeesRef.current) observer.observe(employeesRef.current);
    if (holidaysRef.current) observer.observe(holidaysRef.current);
    if (leavesRef.current) observer.observe(leavesRef.current);

    return () => observer.disconnect();
  }, []);
  // --- AI Eklentisi Sonu ---

  return (
    <>
      <Sidebar />
      <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-6">
        <div className="w-[33%] h-full p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-7 h-7 text-gray-800" />
            <h2 className="text-xl font-bold text-gray-800">Çalışanlar</h2>
          </div>

          <div ref={employeesRef} className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
            {mockUsers.users
              .filter((user) => user.role === "Çalışan")
              .slice(0, employeeCount)
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 flex-1">
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
        {/* <div className="w-[33%] gap-6 flex flex-col">
          <div className="h-[50%] p-6 rounded-xl border border-gray-100 shadow-sm"></div>
          <div className="h-[50%] p-6 rounded-xl border border-gray-100 shadow-sm"></div>
        </div> */}
        <div className="w-[33%] gap-6 flex flex-col">
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <BadgeInfo className="w-7 h-7 text-gray-800" />
              <h2 className="text-xl font-bold text-gray-800">
                Yaklaşan Resmi Tatiller
              </h2>
            </div>

            <div ref={holidaysRef} className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
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
                      <p className="text-xs text-gray-500">
                        {DateTime.fromISO(tatil.tarih)
                          .setLocale("tr")
                          .toLocaleString(DateTime.DATE_FULL)}
                      </p>
                    </div>
                    <span className="inline-block bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {tatil.gun_sayisi} gün
                    </span>
                  </div>
                ))}
            </div>

            <ViewAllButton label="Takvime" path="/calendar" />
          </div>
          <div className="flex-1 min-h-0 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <ClockArrowUp className="w-7 h-7 text-gray-800" />
              <h2 className="text-xl font-bold text-gray-800">
                Yaklaşan İzinler
              </h2>
            </div>

            <div ref={leavesRef} className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
              {mockUsers.users
                .flatMap((user) =>
                  (user.leaves || []).map((leave) => ({
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
                    <div className="flex items-center gap-2 flex-1">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${leave.firstName}%${leave.lastName}`}
                        alt={leave.employeeName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-md font-semibold text-gray-800 truncate">
                          {leave.employeeName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {DateTime.fromISO(leave.startDate)
                            .setLocale("tr")
                            .toLocaleString(DateTime.DATE_FULL)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-block bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
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