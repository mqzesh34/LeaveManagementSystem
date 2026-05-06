import React from "react";
import ViewAllButton from "./ViewAllButton";

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  viewAllPath?: string;
  viewAllLabel?: string;
  buttonText?: string;
  className?: string;
  rightContent?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  children,
  viewAllPath,
  viewAllLabel,
  buttonText,
  className = "",
  rightContent,
}) => {
  return (
    <div
      className={`p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between mb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <h2 className="text-xl truncate font-bold text-gray-800 underline-offset-5 underline">
            {title}
          </h2>
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
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
