import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { Bell, Home, LogOut, Calendar1, SlidersHorizontal, History, Plus, Users } from "lucide-react";
import { useAuth } from "../context/authContext.tsx";
import { api, authApi, notificationApi } from "../services/api";

interface SidebarNotification {
  id: string;
  type: "leave_created" | "leave_approved" | "leave_rejected";
  title: string;
  message: string;
  leaveId: number;
  createdAt: string;
  isRead?: boolean;
  actor?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

const Sidebar = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SidebarNotification[]>([]);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role?.toLowerCase();
  const canManageLeaves = userRole === "admin" || userRole === "team_lead";
  const handleLogout = async () => {
    await authApi.logout();
    logout();
    navigate("/", { replace: true, state: { skipPageLoader: true } });
  };
  useEffect(() => {
    const updateDateTime = () => {
      const now = DateTime.now().setZone("Europe/Istanbul").setLocale("tr");

      setCurrentDate(now.toFormat("dd MMMM cccc"));
      setCurrentTime(now.toFormat("HH:mm"));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user) {
        setTeamName(null);
        return;
      }

      try {
        const result = await api.get("/teams/my");
        setTeamName(result.data?.teamName || null);
      } catch {
        setTeamName(null);
      }
    };

    fetchTeam();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const result = await notificationApi.get();
        if (result.success && Array.isArray(result.data)) {
          setNotifications(result.data);
        }
      } catch (error) {
        console.error("Bildirimler alınamadı:", error);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleNotificationReceived = (event: Event) => {
      const notification = (event as CustomEvent<SidebarNotification>).detail;
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ]);
    };

    const handleNotificationDeleted = (event: Event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      setNotifications((current) => current.filter((item) => item.id !== id));
    };

    const handleNotificationRead = (event: Event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      setNotifications((current) =>
        current.map((item) => item.id === id ? { ...item, isRead: true } : item),
      );
    };

    const handleNotificationsClearedPermanently = () => {
      setNotifications([]);
    };

    const handleNotificationsCleared = () => {
      setIsNotificationsPanelOpen(false);
    };

    const handleNotificationsShown = () => {
      setIsNotificationsPanelOpen(true);
    };

    window.addEventListener("notification-received", handleNotificationReceived);
    window.addEventListener("notification-deleted", handleNotificationDeleted);
    window.addEventListener("notification-read", handleNotificationRead);
    window.addEventListener("notifications-cleared-permanently", handleNotificationsClearedPermanently);
    window.addEventListener("notifications-cleared", handleNotificationsCleared);
    window.addEventListener("show-notifications-top-right", handleNotificationsShown);

    return () => {
      window.removeEventListener("notification-received", handleNotificationReceived);
      window.removeEventListener("notification-deleted", handleNotificationDeleted);
      window.removeEventListener("notification-read", handleNotificationRead);
      window.removeEventListener("notifications-cleared-permanently", handleNotificationsClearedPermanently);
      window.removeEventListener("notifications-cleared", handleNotificationsCleared);
      window.removeEventListener("show-notifications-top-right", handleNotificationsShown);
    };
  }, []);

  const handleOpenNotificationPanel = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (notifications.length === 0) {
      toast("Aktif bildiriminiz yok", {
        position: "top-left",
      });
      return;
    }

    if (isNotificationsPanelOpen) {
      window.dispatchEvent(new CustomEvent("notifications-cleared"));
      setIsNotificationsPanelOpen(false);
      return;
    }

    const visibleNotifications = notifications.map((item) => ({ ...item, isRead: true }));
    setNotifications(visibleNotifications);
    window.dispatchEvent(
      new CustomEvent("show-notifications-top-right", {
        detail: visibleNotifications,
      }),
    );
    setIsNotificationsPanelOpen(true);

    try {
      await notificationApi.readAll();
    } catch (error) {
      console.error("Bildirimler okundu yapılamadı:", error);
    }
  };

  const capitalize = (str: string | undefined) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const menuItems = [
    { name: "AnaSayfa", href: "/main", icon: Home },
    { name: "Takvim", href: "/calendar", icon: Calendar1 },
    ...(canManageLeaves
      ? [
        { name: "İzin İstekleri", href: "/management", icon: SlidersHorizontal },
        { name: "İstek Geçmişi", href: "/history-leaves", icon: History },
        ...(userRole === "admin"
          ? [{ name: "Yönetim", href: "/admin-management", icon: Users }]
          : []),
        ...(userRole === "team_lead"
          ? [{ name: "İzin Talebi Oluştur", href: "/request-leave", icon: Plus }]
          : []),
      ]
      : [
        { name: "İzin Talebi Oluştur", href: "/request-leave", icon: Plus },
      ]),
  ];

  return (
    <div>
      <div className="fixed top-20 left-0 bottom-20 flex flex-col border border-gray-100 rounded-tr-xl rounded-br-xl p-4 shadow-sm transition-all duration-300 w-64">
        <div className="flex justify-center w-full">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}%${user.lastName}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-gray-800 min-w-fit truncate">
                      {`${capitalize(user.firstName)} ${capitalize(user.lastName)}`}
                    </span>
                    {teamName && (
                      <span className="text-gray-800 text-sm truncate">
                        {teamName}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {user && (
          <div className="h-0.5 border rounded-full border-gray-100 my-4"></div>
        )}
        <>
          <nav className="flex flex-col space-y-2 w-full text-lg">
            <div className="flex flex-col space-y-3">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg duration-400 ${location.pathname === item.href
                    ? "bg-gray-200 text-gray-800 border-2 border-gray-800"
                    : "text-gray-700 hover:bg-gray-100 border-gray-100 border-2"
                    }`}
                >
                  <item.icon size={24} className="mr-3" />
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
          <div className="grow"></div>
          <button
            type="button"
            data-notification-toggle
            onClick={handleOpenNotificationPanel}
            className="mb-2 flex w-full items-center rounded-lg border-2 border-gray-100 px-4 py-3 text-lg text-gray-700 duration-400 hover:bg-gray-100"
          >
            <Bell size={24} className="mr-3" />
            <span className="flex-1 text-left">Bildirimler</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-none text-white">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>
          <div className="h-0.5 border rounded-full border-gray-100 my-4 "></div>
          <div className="flex justify-between items-center w-full gap-4">
            <div className="flex flex-col">
              <p className="text-lg text-gray-700">{currentDate}</p>
              <p className="text-2xl font-bold text-gray-900">{currentTime}</p>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center w-10 h-10 rounded-lg duration-400 text-red-700 bg-red-100 hover:bg-red-200 border-red-200 border-2`}
            >
              <LogOut className="text-2xl text-center" />
            </button>
          </div>
        </>
      </div>
    </div>
  );
};

export default Sidebar;
