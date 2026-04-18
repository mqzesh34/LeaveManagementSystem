import DashboardCard from "../components/DashboardCard";
import DashboardList from "../components/DashboardList";
import EmployeeListItem from "../components/EmployeeListItem";
import { CheckCircle2, XCircle } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const HistoryLeavesPage = () => {
    const [allData, setAllData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.get("/leaves/admin-view");
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

    const { approvedLeaves, rejectedLeaves } = useMemo(() => {
        const now = DateTime.now();

        const leavesOnly = allData
            .filter((item: any) => item.leaveId)
            .map((item: any) => ({
                leaveId: item.leaveId,
                employeeName: `${item.firstName} ${item.lastName}`,
                firstName: item.firstName,
                lastName: item.lastName,
                reason: item.reason,
                startDate: item.startDate,
                days: item.days,
                status: item.status,
            }))
            .filter((leave: any) => {
                const leaveDate = DateTime.fromISO(leave.startDate);
                return leaveDate <= now.endOf("day");
            })
            .sort(
                (a: any, b: any) =>
                    DateTime.fromISO(b.startDate).toMillis() -
                    DateTime.fromISO(a.startDate).toMillis(),
            );

        return {
            approvedLeaves: leavesOnly.filter(
                (leave: any) =>
                    leave.status === "approved",
            ),
            rejectedLeaves: leavesOnly.filter(
                (leave: any) =>
                    leave.status === "rejected",
            ),
        };
    }, [allData]);

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
                    title="Geçmişte Onaylanan İstekler"
                    icon={<CheckCircle2 className="w-7 h-7 text-emerald-500" />}
                    className="w-[50%] h-full"
                >
                    <DashboardList
                        allItems={approvedLeaves}
                        loading={loading}
                        disableLimit={true}
                        emptyText="Geçmişte onaylanan izin kaydı bulunamadı."
                        renderItem={(leave: any) => (
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
                            />
                        )}
                    />
                </DashboardCard>

                <DashboardCard
                    title="Geçmişte Onaylanmayan İstekler"
                    icon={<XCircle className="w-7 h-7 text-rose-500" />}
                    className="w-[50%] h-full"
                >
                    <DashboardList
                        allItems={rejectedLeaves}
                        loading={loading}
                        disableLimit={true}
                        emptyText="Geçmişte reddedilen izin kaydı bulunamadı."
                        renderItem={(leave: any) => (
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
                            />
                        )}
                    />
                </DashboardCard>

            </div>
        </div>
    );
};

export default HistoryLeavesPage;