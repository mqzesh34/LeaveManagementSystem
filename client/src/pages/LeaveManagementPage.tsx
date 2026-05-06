import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlarmClockCheck } from "lucide-react";
import { api } from "../services/api";
import DashboardCard from "../components/DashboardCard";
import DashboardList from "../components/DashboardList";
import EmployeeListItem from "../components/EmployeeListItem";
import LeaveDetailPopup from "../components/LeaveDetailPopup";

interface LeaveItem {
    leaveId: number;
    id?: number;
    userId?: string;
    employeeName: string;
    firstName: string;
    lastName: string;
    reason: string;
    startDate: string;
    days: number;
    status: "approved" | "rejected" | "pending" | string;
    teamName?: string;
    details?: string;
    description?: string;
    totalAllowed?: number;
    createdAt?: string;
}

const LeaveManagementPage = () => {
    const [allData, setAllData] = useState<LeaveItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState<LeaveItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.get("/leaves/manager-view");
                if (result.success) {
                    setAllData(result.data);
                }
            } catch (error) {
                console.error("Yonetim verisi alinmadi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const { approvedLeaves, rejectedLeaves, pendingLeaves } = useMemo(() => {
        const leavesOnly = allData
            .filter((item) => item.leaveId)
            .map((item) => ({
                ...item,
                leaveId: item.leaveId,
                employeeName: `${item.firstName} ${item.lastName}`,
                firstName: item.firstName,
                lastName: item.lastName,
                reason: item.reason,
                startDate: item.startDate,
                days: item.days,
                status: item.status,
            }))
            .sort(
                (a, b) =>
                    DateTime.fromISO(b.startDate).toMillis() -
                    DateTime.fromISO(a.startDate).toMillis(),
            );

        return {
            approvedLeaves: leavesOnly.filter(
                (leave) =>
                    leave.status === "approved",
            ),
            rejectedLeaves: leavesOnly.filter(
                (leave) =>
                    leave.status === "rejected",
            ),
            pendingLeaves: leavesOnly.filter(
                (leave) =>
                    leave.status === "pending",
            ),
        };
    }, [allData]);

    const selectedLeaveStats = useMemo(() => {
        if (!selectedLeave) return null;

        const userLeaves = allData.filter(
            (item) => String(item.userId) === String(selectedLeave.userId) && item.leaveId,
        );
        const totalAllowed = selectedLeave.totalAllowed || userLeaves[0]?.totalAllowed || 20;
        const totalUsed = userLeaves
            .filter((item) => item.status === "approved")
            .reduce((sum, item) => sum + (item.days ?? 0), 0);

        return {
            totalUsed,
            totalAllowed,
            remaining: Math.max(0, totalAllowed - totalUsed),
            pendingCount: userLeaves.filter((item) => item.status === "pending").length,
            approvedCount: userLeaves.filter((item) => item.status === "approved").length,
            rejectedCount: userLeaves.filter((item) => item.status === "rejected").length,
            ratio: totalUsed / totalAllowed,
        };
    }, [allData, selectedLeave]);

    const handleApproveLeave = async (id: number) => {
        const result = await api.put(`/leaves/approve/${id}`);
        if (result.success) {
            window.location.reload();
        }
    };

    const handleRejectLeave = async (id: number) => {
        const result = await api.put(`/leaves/reject/${id}`);
        if (result.success) {
            window.location.reload();
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center font-bold text-gray-500">
                Veriler hazırlanıyor...
            </div>
        );
    }

    return (
        <div>
            <div className="no-scrollbar absolute top-20 bottom-20 left-72 right-8 flex-row flex gap-4">
                <DashboardCard
                    title="Onaylanan İstekler"
                    icon={<CheckCircle2 className="w-7 h-7 text-emerald-500" />}
                    className="w-[33%] h-full"
                >
                    <DashboardList
                        allItems={approvedLeaves}
                        loading={loading}
                        disableLimit={true}
                        emptyText="Bu dönemde onaylanan izin talebi bulunmuyor."
                        renderItem={(leave) => (
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
                                onClick={() => setSelectedLeave(leave)}
                            />
                        )}
                    />
                </DashboardCard>

                <DashboardCard
                    title="Onaylanmayan İstekler"
                    icon={<XCircle className="w-7 h-7 text-rose-500" />}
                    className="w-[33%] h-full"
                >
                    <DashboardList
                        allItems={rejectedLeaves}
                        loading={loading}
                        disableLimit={true}
                        emptyText="Bu dönemde reddedilen izin talebi bulunmuyor."
                        renderItem={(leave) => (
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
                                onClick={() => setSelectedLeave(leave)}
                            />
                        )}
                    />
                </DashboardCard>

                <DashboardCard
                    title="Bekleyen İstekler"
                    icon={<AlarmClockCheck className="w-7 h-7 text-amber-500" />}
                    className="w-[33%] h-full"
                >
                    <DashboardList
                        allItems={pendingLeaves}
                        loading={loading}
                        disableLimit={true}
                        emptyText="Onay bekleyen izin talebi bulunmuyor."
                        renderItem={(leave) => (
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
                                onClick={() => setSelectedLeave(leave)}
                            />
                        )}
                    />
                </DashboardCard>
            </div>

            <LeaveDetailPopup
                isOpen={!!selectedLeave}
                onClose={() => setSelectedLeave(null)}
                title={selectedLeave?.status === "pending" ? "İzin Talebi Detayları" : "İzin Detayları"}
                leaveData={selectedLeave ? {
                    ...selectedLeave,
                    description: selectedLeave.details || selectedLeave.description || "",
                } : null}
                stats={selectedLeaveStats}
                showActions={selectedLeave?.status === "pending"}
                showStatsHistory={true}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
            />
        </div>
    );
};

export default LeaveManagementPage;
