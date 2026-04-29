import { motion } from "framer-motion";
import { getLeaveColor } from "../utils/leaveUtils";

interface LeaveStatsOverviewProps {
  totalUsed: number;
  totalAllowed: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  projectedDays?: number;
  showHistory?: boolean;
  themeColor?: "indigo" | "blue" | "amber" | "emerald";
}


const LeaveStatsOverview: React.FC<LeaveStatsOverviewProps> = ({
  totalUsed,
  totalAllowed,
  approvedCount,
  pendingCount,
  rejectedCount,
  projectedDays = 0,
  showHistory = true,
  themeColor
}) => {
  const ratio = totalUsed / totalAllowed;
  const projectedRatio = (totalUsed + projectedDays) / totalAllowed;
  const color = getLeaveColor(ratio, themeColor);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">İzin Durumu</span>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={totalUsed}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-sm font-bold tabular-nums ${color.text}`}
            >
              {totalUsed}
            </motion.span>
            <span className={`text-sm font-bold tabular-nums ${color.text}`}>/ {totalAllowed}</span>
            <span className="text-xs font-bold text-gray-400 ml-0.5">gün</span>
          </div>
        </div>

        <div className="relative w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
          {projectedDays > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, projectedRatio * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full z-10"
              style={{ backgroundColor: color.light }}
            />
          )}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, ratio * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full z-20 rounded-full"
            style={{ backgroundColor: color.hex }}
          />
        </div>
      </div>

      {showHistory && (
        <>
          <div className="h-px bg-gray-200"></div>

          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <span className="text-sm text-gray-500 font-medium">Talep Geçmişi</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center border-2 bg-emerald-50 border-emerald-200 rounded-xl py-2">
                <span className="text-lg font-bold text-emerald-600">{approvedCount}</span>
                <span className="text-[13px] text-emerald-600">Onaylanan</span>
              </div>
              <div className="flex flex-col items-center border-2 bg-amber-50 border-amber-200 rounded-xl py-2">
                <span className="text-lg font-bold text-amber-600">{pendingCount}</span>
                <span className="text-[13px] text-amber-600">Bekleyen</span>
              </div>
              <div className="flex flex-col items-center border-2 bg-rose-50 border-rose-200 rounded-xl py-2">
                <span className="text-lg font-bold text-rose-600">{rejectedCount}</span>
                <span className="text-[13px] text-rose-600">Reddedilen</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveStatsOverview;
