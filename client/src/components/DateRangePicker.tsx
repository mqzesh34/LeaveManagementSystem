import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onRangeChange: (start: string | null, end: string | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
}) => {
  const [viewDate, setViewDate] = useState(DateTime.now());
  const monthName = viewDate.setLocale("tr").toFormat("LLLL");
  const year = viewDate.year;

  const daysInMonth = viewDate.daysInMonth || 30;
  const firstDayOfMonth = viewDate.startOf("month").weekday;
  const emptyDays = firstDayOfMonth - 1;

  const handleDateClick = (dateISO: string) => {
    if (!startDate || (startDate && endDate)) {
      onRangeChange(dateISO, null);
    } else {
      if (dateISO < startDate) {
        onRangeChange(dateISO, startDate);
      } else {
        onRangeChange(startDate, dateISO);
      }
    }
  };

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = viewDate.set({ day: i });
    const dateISO = date.toISODate();
    if (dateISO) days.push(dateISO);
  }

  const renderContinuousRange = (dateISO: string, index: number) => {
    if (!startDate || !endDate || startDate === endDate) return null;
    
    const isStart = startDate === dateISO;
    const isEnd = endDate === dateISO;
    const isInRange = dateISO > startDate && dateISO < endDate;
    
    if (!isStart && !isEnd && !isInRange) return null;

    const gridPos = (index + emptyDays) % 7;
    const isMonday = gridPos === 0;
    const isSunday = gridPos === 6;

    let classes = "absolute inset-y-0 border-dashed border-blue-200 z-[-1] ";
    
    if (isStart) {
      classes += "left-0 right-[-4px] border-t-2 border-b-2 border-l-2 rounded-l-xl";
      if (isSunday) classes += " border-r-2 rounded-r-xl right-0";
    } else if (isEnd) {
      classes += "left-[-4px] right-0 border-t-2 border-b-2 border-r-2 rounded-r-xl";
      if (isMonday) classes += " border-l-2 rounded-l-xl left-0";
    } else {
      classes += "left-[-4px] right-[-4px] border-t-2 border-b-2";
      if (isMonday) classes += " border-l-2 rounded-l-xl left-0";
      if (isSunday) classes += " border-r-2 rounded-r-xl right-0";
    }

    return <div className={classes} />;
  };

  return (
    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden w-full max-w-[350px]">
      <div className="bg-gray-50 border-b-2 border-gray-100 p-3.5 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-gray-100">
          <CalendarIcon className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tarih</span>
          <span className="text-[13px] font-bold text-gray-800 leading-tight">
            {startDate ? (
              <>
                {DateTime.fromISO(startDate).setLocale("tr").toFormat("dd.MM.yyyy")}
                {endDate && ` - ${DateTime.fromISO(endDate).setLocale("tr").toFormat("dd.MM.yyyy")}`}
              </>
            ) : (
              "Lütfen tarih seçiniz..."
            )}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[12px] font-black text-gray-700 uppercase tracking-widest px-1">
            {monthName} {year}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setViewDate(viewDate.minus({ months: 1 }))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setViewDate(viewDate.plus({ months: 1 }))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
            <span key={d} className="text-[10px] font-bold text-gray-300 uppercase">{d}</span>
          ))}
          
          {Array(emptyDays).fill(0).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((dateISO, index) => {
            const todayISO = DateTime.now().toISODate() || "";
            const isPast = dateISO < todayISO;
            const isStart = startDate === dateISO;
            const isEnd = endDate === dateISO;
            const isToday = dateISO === todayISO;

            return (
              <div key={dateISO} className="relative z-10 py-1">
                {renderContinuousRange(dateISO, index)}
                <button
                  onClick={() => !isPast && handleDateClick(dateISO)}
                  disabled={isPast}
                  className={`relative w-9 h-9 mx-auto flex items-center justify-center text-[12px] font-bold rounded-full transition-all duration-200 z-10
                    ${isPast ? "opacity-30 cursor-not-allowed text-gray-400" : ""}
                    ${isStart ? "bg-blue-500 text-white border-2 border-blue-400" : ""}
                    ${isEnd && !isStart ? "border-2 border-gray-300 text-gray-800 bg-white" : ""}
                    ${!isStart && !isEnd && !isPast ? "hover:bg-gray-50 text-gray-700" : ""}
                    ${isToday && !isStart && !isEnd ? "text-blue-600 underline underline-offset-4 decoration-2" : ""}
                  `}
                >
                  {DateTime.fromISO(dateISO).day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
