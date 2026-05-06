import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, CalendarPlus, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../services/socket";
import { useAuth } from "../context/authContext";
import { api, notificationApi } from "../services/api";
import LeaveDetailPopup from "./LeaveDetailPopup";

interface NotificationPayload {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  leaveId?: number;
  teamId?: number;
  userId?: string;
  firstName?: string;
  lastName?: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: string;
    teamId?: number | null;
  } | null;
  createdAt?: string;
  isRead?: boolean;
  keepAfterOpen?: boolean;
}

interface LeaveRecord {
  id?: number;
  leaveId?: number;
  userId?: string;
  firstName?: string;
  lastName?: string;
  employeeName?: string;
  teamName?: string;
  details?: string;
  description?: string;
  status?: string;
  days?: number;
  totalAllowed?: number;
  sourceNotificationId?: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

let notificationReloadTimer: ReturnType<typeof setTimeout> | null = null;
const pendingReloadNotificationKey = "pendingReloadNotification";
const notificationEvents = {
  cleared: "notifications-cleared",
  clearedPermanently: "notifications-cleared-permanently",
  deleted: "notification-deleted",
  read: "notification-read",
  received: "notification-received",
  showPanel: "show-notifications-top-right",
  openDetail: "open-notification-detail",
} as const;

const reloadPage = () => {
  window.location.reload();
};

const NotificationSocket = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [isPanelMode, setIsPanelMode] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [popupData, setPopupData] = useState<LeaveRecord[]>([]);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const pendingNotification = sessionStorage.getItem(pendingReloadNotificationKey);
    if (!pendingNotification) return;

    sessionStorage.removeItem(pendingReloadNotificationKey);

    try {
      const notification = JSON.parse(pendingNotification) as NotificationPayload;
      if (!notification.id) return;

      setTimeout(() => {
        setNotifications((current) => [
          notification,
          ...current.filter((item) => item.id !== notification.id),
        ]);

        setTimeout(() => {
          setNotifications((current) => {
            const isCurrentlyPanelMode = document.querySelector('[data-notification-panel-active="true"]');
            if (isCurrentlyPanelMode) return current;
            return current.filter((item) => item.id !== notification.id);
          });
        }, 5000);
      }, 0);
    } catch (error) {
      console.error("Reload sonrası bildirim gösterilemedi:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!isPanelMode) return;

    const closePanelOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest("[data-notification-toggle]")) return;
      if (notificationPanelRef.current?.contains(target)) return;

      window.dispatchEvent(new CustomEvent(notificationEvents.cleared));
    };

    document.addEventListener("pointerdown", closePanelOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closePanelOnOutsideClick);
    };
  }, [isPanelMode]);

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleNotification = (notification: NotificationPayload) => {
      const notificationId =
        notification.id ||
        `${notification.type || "notification"}-${notification.leaveId || Date.now()}`;

      setNotifications((current) => [
        {
          ...notification,
          id: notificationId,
          createdAt: notification.createdAt || new Date().toISOString(),
        },
        ...current.filter((item) => item.id !== notificationId),
      ]);

      if (!isPanelMode) {
        setTimeout(() => {
          setNotifications((current) => {
            const isCurrentlyPanelMode = document.querySelector('[data-notification-panel-active="true"]');
            if (isCurrentlyPanelMode) return current;
            return current.filter((item) => item.id !== notificationId);
          });
        }, 5000);
      }

      window.dispatchEvent(
        new CustomEvent(notificationEvents.received, {
          detail: {
            ...notification,
            id: notificationId,
            createdAt: notification.createdAt || new Date().toISOString(),
          },
        }),
      );

      if (!isPanelMode && !notificationReloadTimer) {
        sessionStorage.setItem(
          pendingReloadNotificationKey,
          JSON.stringify({
            ...notification,
            id: notificationId,
            createdAt: notification.createdAt || new Date().toISOString(),
          }),
        );

        notificationReloadTimer = setTimeout(reloadPage, 800);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user, isPanelMode]);

  const selectedLeaveStats = useMemo(() => {
    if (!selectedLeave) return null;

    const userLeaves = popupData.filter(
      (item) => item.userId === selectedLeave.userId && (item.leaveId ?? item.id),
    );

    const totalUsed = userLeaves
      .filter((item) => item.status === "approved")
      .reduce((sum, item) => sum + (item.days ?? 0), 0);

    const totalAllowed = selectedLeave.totalAllowed || 20;
    const pendingCount = userLeaves.filter((item) => item.status === "pending").length;
    const approvedCount = userLeaves.filter((item) => item.status === "approved").length;
    const rejectedCount = userLeaves.filter((item) => item.status === "rejected").length;

    return {
      totalUsed,
      totalAllowed,
      remaining: Math.max(0, totalAllowed - totalUsed),
      pendingCount,
      approvedCount,
      rejectedCount,
      ratio: totalUsed / totalAllowed,
    };
  }, [selectedLeave, popupData]);

  const dismissNotification = useCallback(async (notificationId?: string) => {
    if (!notificationId) return;
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    window.dispatchEvent(new CustomEvent(notificationEvents.read, { detail: { id: notificationId } }));
    try {
      await notificationApi.read(notificationId);
    } catch (error) {
      console.error("Bildirim okundu yapılamadı:", error);
    }
  }, []);

  const completelyDeleteNotification = useCallback(async (notificationId?: string) => {
    if (!notificationId) return;
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    window.dispatchEvent(new CustomEvent(notificationEvents.deleted, { detail: { id: notificationId } }));
    try {
      await notificationApi.delete(notificationId);
    } catch (error) {
      console.error("Bildirim silinemedi:", error);
    }
  }, []);

  const handleClearAll = async () => {
    setNotifications([]);
    window.dispatchEvent(new CustomEvent(notificationEvents.clearedPermanently));
    window.dispatchEvent(new CustomEvent(notificationEvents.cleared));
    try {
      await notificationApi.deleteAll();
    } catch (error) {
      console.error("Bildirimler silinemedi:", error);
    }
  };

  const openLeaveDetail = useCallback(async (notification: NotificationPayload) => {
    if (!notification.leaveId) return;

    if (isPanelMode) {
      setIsPanelMode(false);
      setNotifications([]);
      window.dispatchEvent(new CustomEvent(notificationEvents.cleared));
    }

    try {
      const primaryEndpoint =
        notification.type === "leave_created" ? "/leaves/manager-view" : "/leaves/my";
      const result = await api.get(primaryEndpoint);
      let leaves: LeaveRecord[] = Array.isArray(result.data) ? result.data : [];
      let leave = leaves.find((item) => Number(item.leaveId ?? item.id) === Number(notification.leaveId));

      if (!leave) {
        const fallback = await api.get(primaryEndpoint === "/leaves/my" ? "/leaves/manager-view" : "/leaves/my");
        const fallbackLeaves: LeaveRecord[] = Array.isArray(fallback.data) ? fallback.data : [];
        leave = fallbackLeaves.find((item) => Number(item.leaveId ?? item.id) === Number(notification.leaveId));
        if (leave) leaves = fallbackLeaves;
      }

      if (!leave) {
        toast.error("İzin talebi bulunamadı.");
        return;
      }

      setPopupData(leaves);
      setSelectedLeave({ ...leave, leaveId: leave.leaveId ?? leave.id, sourceNotificationId: notification.id });
      if (notification.type === "leave_approved" || notification.type === "leave_rejected") {
        await completelyDeleteNotification(notification.id);
      } else {
        await dismissNotification(notification.id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "İzin talebi detayı alınamadı."));
    }
  }, [completelyDeleteNotification, dismissNotification, isPanelMode]);

  useEffect(() => {
    const handleOpenNotification = (event: Event) => {
      const notification = (event as CustomEvent<NotificationPayload>).detail;
      openLeaveDetail(notification);
    };

    const handleShowNotificationsTopRight = (event: Event) => {
      const sidebarNotifications = (event as CustomEvent<NotificationPayload[]>).detail;
      setIsPanelMode(true);
      setNotifications(
        sidebarNotifications.map((notification) => ({
          ...notification,
          id:
            notification.id ||
            `${notification.type || "notification"}-${notification.leaveId || Date.now()}`,
          createdAt: notification.createdAt || new Date().toISOString(),
        })),
      );
    };

    const handleNotificationsCleared = () => {
      setNotifications([]);
      setIsPanelMode(false);
    };

    window.addEventListener(notificationEvents.openDetail, handleOpenNotification);
    window.addEventListener(notificationEvents.showPanel, handleShowNotificationsTopRight);
    window.addEventListener(notificationEvents.cleared, handleNotificationsCleared);

    return () => {
      window.removeEventListener(notificationEvents.openDetail, handleOpenNotification);
      window.removeEventListener(notificationEvents.showPanel, handleShowNotificationsTopRight);
      window.removeEventListener(notificationEvents.cleared, handleNotificationsCleared);
    };
  }, [openLeaveDetail]);

  const handleApproveLeave = async (id: number) => {
    const result = await api.put(`/leaves/approve/${id}`);
    if (result.success) {
      setPopupData((current) =>
        current.map((item) => (item.leaveId === id ? { ...item, status: "approved" } : item)),
      );
      if (selectedLeave?.sourceNotificationId) {
        await completelyDeleteNotification(selectedLeave.sourceNotificationId);
      }
      reloadPage();
    }
  };

  const handleRejectLeave = async (id: number) => {
    const result = await api.put(`/leaves/reject/${id}`);
    if (result.success) {
      setPopupData((current) =>
        current.map((item) => (item.leaveId === id ? { ...item, status: "rejected" } : item)),
      );
      if (selectedLeave?.sourceNotificationId) {
        await completelyDeleteNotification(selectedLeave.sourceNotificationId);
      }
      reloadPage();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isPanelMode && (
          <motion.div
            key="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed right-0 top-0 bottom-0 z-[100000] w-[min(560px,100vw)] bg-white/20 backdrop-blur-md [mask-image:linear-gradient(to_left,black_0%,black_70%,rgba(0,0,0,0.35)_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_left,black_0%,black_70%,rgba(0,0,0,0.35)_88%,transparent_100%)]"
          />
        )}
      </AnimatePresence>

      <div
        ref={notificationPanelRef}
        data-notification-panel-active={isPanelMode}
        className="fixed right-4 top-4 z-[100001] flex w-[360px] max-w-[calc(100vw-24px)] flex-col gap-3"
      >
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              layout
              role={notification.leaveId ? "button" : undefined}
              tabIndex={notification.leaveId ? 0 : undefined}
              onClick={() => openLeaveDetail(notification)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  openLeaveDetail(notification);
                }
              }}
              className="group cursor-pointer pointer-events-auto flex items-start gap-3 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-xl will-change-transform transition-colors duration-200 hover:bg-gray-200"
            >
              <div className="relative">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${notification.actor?.firstName || notification.firstName || "Kullanıcı"}%${notification.actor?.lastName || notification.lastName || ""}`}
                  alt={`${notification.actor?.firstName || notification.firstName || "Kullanıcı"} ${notification.actor?.lastName || notification.lastName || ""}`}
                  className="h-11 w-11 shrink-0 rounded-xl border border-indigo-100 object-cover bg-indigo-50 shadow-sm"
                />
                <div className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full shadow-sm ${notification.type === 'leave_created' ? 'bg-indigo-500' :
                    notification.type === 'leave_approved' ? 'bg-emerald-500' :
                      'bg-rose-500'
                  }`}>
                  {notification.type === 'leave_created' && <CalendarPlus className="h-2.5 w-2.5 text-white" />}
                  {notification.type === 'leave_approved' && <Check className="h-2.5 w-2.5 text-white" />}
                  {notification.type === 'leave_rejected' && <X className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-0.5 truncate text-sm font-bold text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm leading-5 text-gray-600 line-clamp-2">
                  {notification.message}
                </p>
              </div>

            </motion.div>
          ))}
          {isPanelMode && notifications.length > 0 && (
            <motion.div
              key="clear-all-button"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                  transition: { duration: 0.2 }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="group pointer-events-auto flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-100 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 active:scale-95 shadow-md shadow-red-900/5 will-change-transform"
              >
                <Trash2 size={14} className="transition-transform group-hover:scale-110" />
                Tümünü Sil
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LeaveDetailPopup
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="İzin Talebi Detayları"
        leaveData={
          selectedLeave
            ? {
              ...selectedLeave,
              firstName: selectedLeave.firstName || user?.firstName || "",
              lastName: selectedLeave.lastName || user?.lastName || "",
              employeeName:
                selectedLeave.employeeName ||
                `${selectedLeave.firstName || user?.firstName || ""} ${selectedLeave.lastName || user?.lastName || ""}`,
              teamName: selectedLeave.teamName || (user?.teamId ? `Takım #${user.teamId}` : "Bilinmiyor"),
              description: selectedLeave.details || selectedLeave.description || "",
            }
            : null
        }
        stats={selectedLeaveStats}
        showActions={
          selectedLeave?.status === "pending" && String(selectedLeave?.userId) !== String(user?.id)
        }
        showStatsHistory={true}
        onApprove={handleApproveLeave}
        onReject={handleRejectLeave}
      />
    </>
  );
};

export default NotificationSocket;
