import React from "react";

interface EmployeeListItemProps {
  firstName?: string;
  lastName?: string;
  imageAlt?: string;
  primaryText: string;
  secondaryText?: string;
  badgeContent?: React.ReactNode;
  extraContent?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  firstName,
  lastName,
  imageAlt,
  primaryText,
  secondaryText,
  badgeContent,
  extraContent,
  icon,
  onClick,
  className = "",
}) => {
  const avatarUrl =
    firstName && lastName
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%${lastName}`
      : null;

  return (
    <div
      onClick={onClick}
      className={`flex items-start justify-between p-2 rounded-lg border-2 border-gray-200 transition-colors duration-200 ${
        onClick ? "cursor-pointer hover:bg-gray-200" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={imageAlt || primaryText}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : icon ? (
          <div className="shrink-0">{icon}</div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-md font-semibold text-gray-800 truncate">
            {primaryText}
          </p>
          {secondaryText && (
            <p className="text-xs truncate text-gray-500">{secondaryText}</p>
          )}
          {extraContent && <div className="mt-1">{extraContent}</div>}
        </div>
      </div>
      {badgeContent && (
        <span className="inline-block shrink-0 bg-gray-200 border text-gray-800 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
          {badgeContent}
        </span>
      )}
    </div>
  );
};

export default EmployeeListItem;
