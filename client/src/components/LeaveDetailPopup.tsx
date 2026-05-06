import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  ClockArrowUp,
  ArrowLeft,
} from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Popup from "./Popup";
import LeaveStatsOverview from "./LeaveStatsOverview";

interface LeaveDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  leaveData: any;
  stats: {
    totalUsed: number;
    totalAllowed: number;
    remaining: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    ratio: number;
  } | null;
  showActions?: boolean;
  showStatsHistory?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
}

const LeaveDetailPopup: React.FC<LeaveDetailPopupProps> = ({
  isOpen,
  onClose,
  title = "İzin Detayları",
  leaveData,
  stats,
  showActions = false,
  showStatsHistory = true,
  onApprove,
  onReject,
}) => {
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; id: number } | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<"approve" | "reject" | null>(null);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    try {
      if (type === "approve" && onApprove) {
        await onApprove(id);
      } else if (type === "reject" && onReject) {
        await onReject(id);
      }
      setConfirmAction(null);
      setSuccessAnimation(type);
      setTimeout(() => {
        setSuccessAnimation(null);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(`İzin ${type === "approve" ? "onaylanamadı" : "reddedilemedi"}:`, error);
    }
  };

  const statusBadge = leaveData?.status === "approved"
    ? { label: "Onaylandı", className: "border-emerald-400 bg-emerald-50 text-emerald-600", icon: CheckCircle2 }
    : leaveData?.status === "rejected"
      ? { label: "Reddedildi", className: "border-rose-400 bg-rose-50 text-rose-600", icon: XCircle }
      : { label: "Onay Bekliyor", className: "border-amber-400 bg-amber-50 text-amber-600", icon: ClockArrowUp };

  const overlay = showActions ? (
    <>
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-center flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${confirmAction.type === "approve" ? "bg-emerald-100" : "bg-rose-100"
                  }`}
              >
                {confirmAction.type === "approve"
                  ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  : <XCircle className="w-8 h-8 text-rose-600" />}
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {confirmAction.type === "approve" ? "İzni Onaylıyorsunuz" : "İzni Reddediyorsunuz"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {confirmAction.type === "approve"
                    ? "Bu izin talebini onaylamak istediğinize emin misiniz?"
                    : "Bu izin talebini reddetmek istediğinize emin misiniz?"}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200 text-sm font-semibold transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri Dön
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border-2 ${confirmAction.type === "approve"
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500 hover:border-emerald-600"
                    : "bg-rose-500 text-white hover:bg-rose-600 border-rose-500 hover:border-rose-600"
                    }`}
                >
                  {confirmAction.type === "approve" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {confirmAction.type === "approve" ? "Evet, Onayla" : "Evet, Reddet"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center z-50"
          >
            <div className="text-center flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${successAnimation === "approve" ? "bg-emerald-100" : "bg-rose-100"
                  }`}
              >
                {successAnimation === "approve"
                  ? <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  : <XCircle className="w-10 h-10 text-rose-500" />}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-lg font-bold text-gray-800"
              >
                {successAnimation === "approve" ? "İzin Onaylandı!" : "İzin Reddedildi!"}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  ) : undefined;

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={title}>
      {overlay}
      {leaveData && stats && (
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-2 bg-white border-gray-200 border-2 rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${leaveData.firstName}%${leaveData.lastName}`}
                alt={leaveData.employeeName}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {leaveData.employeeName}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {leaveData.teamName}
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            <LeaveStatsOverview
              totalUsed={stats.totalUsed}
              totalAllowed={stats.totalAllowed}
              approvedCount={stats.approvedCount}
              pendingCount={stats.pendingCount}
              rejectedCount={stats.rejectedCount}
              showHistory={showStatsHistory}
            />


            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 font-medium">Talep Tarihi</span>
                <span className="text-sm font-bold text-gray-800">
                  {leaveData.createdAt
                    ? DateTime.fromISO(leaveData.createdAt).setLocale("tr").toLocaleString(DateTime.DATETIME_MED)
                    : "Bilinmiyor"}
                </span>
              </div>
              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusBadge.className}`}>
                <statusBadge.icon className="w-3.5 h-3.5" />
                {statusBadge.label}
              </span>
            </div>
          </div>

          <div className="col-span-3 bg-white border-gray-200 border-2 rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm text-gray-500 font-medium">İzin Bilgileri</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "İzin Türü", value: leaveData.reason, icon: FileText, bgClass: "bg-indigo-100", textClass: "text-indigo-600" },
                  { label: "Süre", value: `${leaveData.days} gün`, icon: Clock, bgClass: "bg-violet-100", textClass: "text-violet-600" },
                  { label: "Başlangıç", value: DateTime.fromISO(leaveData.startDate).setLocale("tr").toLocaleString(DateTime.DATE_MED), icon: Calendar, bgClass: "bg-emerald-100", textClass: "text-emerald-600" },
                  { label: "Bitiş", value: DateTime.fromISO(leaveData.startDate).plus({ days: leaveData.days - 1 }).setLocale("tr").toLocaleString(DateTime.DATE_MED), icon: Calendar, bgClass: "bg-rose-100", textClass: "text-rose-600" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className={`w-8 h-8 rounded-lg ${item.bgClass} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.textClass}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">{item.label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {leaveData.description !== null && (
              <>
                <div className="h-px bg-gray-200"></div>

                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-sm text-gray-500 font-medium">Açıklama</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {leaveData.description || "Açıklama belirtilmemiş."}
                    </p>
                  </div>
                </div>
              </>
            )}

            {showActions && (
              <>
                <div className="h-px bg-gray-200"></div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-300 text-sm font-semibold transition-all duration-200 cursor-pointer" onClick={() => setConfirmAction({ type: "reject", id: leaveData.leaveId })}>
                    <XCircle className="w-4 h-4" />
                    Reddet
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-300 text-sm font-semibold transition-all duration-200 cursor-pointer" onClick={() => setConfirmAction({ type: "approve", id: leaveData.leaveId })}>
                    <CheckCircle2 className="w-4 h-4" />
                    Onayla
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )
      }
    </Popup >
  );
};

export default LeaveDetailPopup;
