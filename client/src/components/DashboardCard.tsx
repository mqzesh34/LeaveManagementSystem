import React from "react";
import ViewAllButton from "./ViewAllButton";

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  viewAllPath?: string;
  viewAllLabel?: string;
  buttonText?: string;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  children,
  viewAllPath,
  viewAllLabel,
  buttonText,
  className = "",
}) => {
  return (
    <div
      className={`p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="shrink-0">{icon}</span>
        <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
          {title}
        </h2>
      </div>
      {children}
      {viewAllPath && (
        <ViewAllButton
          label={viewAllLabel || title}
          path={viewAllPath}
          buttonText={buttonText || "Tümünü Gör"}
        />
      )}
    </div>
  );
};

export default DashboardCard;
