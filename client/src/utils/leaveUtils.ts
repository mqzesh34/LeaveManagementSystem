import { DateTime } from "luxon";

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
