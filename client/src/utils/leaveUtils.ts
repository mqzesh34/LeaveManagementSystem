import { DateTime } from "luxon";

export const getLeaveColor = (ratio: number, theme?: string) => {
  if (theme === "amber") return { hex: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-600", bar: "bg-amber-500", light: "#fef3c7" };
  if (theme === "blue") return { hex: "#2563eb", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-600", bar: "bg-blue-500", light: "#dbeafe" };
  
  if (ratio >= 0.75) return { hex: "#f43f5e", text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-600", bar: "bg-rose-500", light: "#ffe4e6" };
  if (ratio >= 0.5) return { hex: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-600", bar: "bg-amber-500", light: "#fef3c7" };
  return { hex: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-600", bar: "bg-emerald-500", light: "#d1fae5" };
};

export const formatLeaveItem = (item: any, now: DateTime) => {
  if (!item.startDate) return item;

  const startDt = DateTime.fromISO(item.startDate).startOf("day");
  const endDt = startDt.plus({ days: item.days - 1 });
  const startDateFormatted = startDt.setLocale("tr").toFormat("dd LLL");
  const endDateFormatted = endDt.setLocale("tr").toFormat("dd LLL");
  const reasonText = item.reason ? `${item.reason} • ` : "";
  const remaining = item.days - Math.floor(now.startOf("day").diff(startDt, "days").days);

  return {
    ...item,
    employeeName: `${item.firstName || ""} ${item.lastName || ""}`.trim(),
    formattedSecondaryText: `${reasonText}${startDateFormatted} - ${endDateFormatted}`,
    formattedBadgeContent: `${item.days} gün`,
    remainingDaysBadge: `${Math.max(0, remaining)} gün`,
  };
};
