import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import tatiller from "../data/tatiller.json";

import { api } from "../services/api";

const statusColor: Record<string, string> = {
  approved: "#22c55e",
  pending: "#f59e0b",
  rejected: "#ef4444",
  holiday: "#64748b",
};

const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const calendarRef = useRef<any>(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const holidaysOnlyMode = params.get("mode") === "holidays";

  useEffect(() => {
    api.get("/leaves/dashboard-stats")
      .then((result) => {
        const data = result.data;
        const mappedEvents: any[] = [];

        tatiller.forEach((tatil) => {
          const gunDongusu = Math.ceil(tatil.gun_sayisi);
          for (let i = 0; i < gunDongusu; i++) {
            const date = new Date(tatil.tarih);
            date.setDate(date.getDate() + i);
            mappedEvents.push({
              title: tatil.ad,
              start: date.toISOString().split("T")[0],
              allDay: true,
              backgroundColor: statusColor.holiday,
              borderColor: "transparent",
              extendedProps: { isHoliday: true },
            });
          }
        });

        if (!holidaysOnlyMode) {
          data
            .filter((leave: any) => leave.status !== "rejected")
            .forEach((leave: any) => {
              for (let i = 0; i < leave.days; i++) {
                const eventDate = new Date(leave.startDate);
                eventDate.setDate(eventDate.getDate() + 1 + i);
                mappedEvents.push({
                  title: `${leave.firstName} ${leave.lastName}`,
                  start: eventDate.toISOString().split("T")[0],
                  allDay: true,
                  backgroundColor: statusColor[leave.status],
                  borderColor: "transparent",
                  extendedProps: {
                    reason: leave.reason,
                    status: leave.status,
                    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(leave.firstName + " " + leave.lastName)}`,
                    isHoliday: false,
                  },
                });
              }
            });
        }

        setEvents(mappedEvents);
      });
  }, [holidaysOnlyMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetDate = params.get("date");
    const targetView = params.get("view");

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (targetDate) calendarApi.gotoDate(targetDate);
      if (targetView) calendarApi.changeView(targetView);
    }
  }, [location]);

  const renderEventContent = (eventInfo: any) => {
    const isHoliday = eventInfo.event.extendedProps.isHoliday;
    return (
      <div className="flex items-center gap-2 p-1 overflow-hidden">
        {!isHoliday && (
          <img
            src={eventInfo.event.extendedProps.avatarUrl}
            alt={eventInfo.event.title}
            className="w-6 h-6 rounded-full bg-white/20 shrink-0"
          />
        )}
        <span
          className={`text-sm font-medium truncate text-white ${isHoliday ? "w-full text-center" : ""}`}
        >
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  return (
    <div>
      <Sidebar />
      <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 p-6 rounded-xl border border-gray-100 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={trLocale}
          initialView="dayGridMonth"
          height="100%"
          handleWindowResize={true}
          events={events}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          eventContent={renderEventContent}
          views={{
            dayGridMonth: {
              dayMaxEvents: 2,
            },
          }}
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
