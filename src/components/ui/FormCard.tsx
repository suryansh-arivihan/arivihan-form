import React from "react";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
  hasTopBorder?: boolean;
  borderColor?: string;
}

export default function FormCard({
  children,
  className = "",
  hasTopBorder = false,
  borderColor = "bg-primary-700",
}: FormCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-form overflow-hidden ${className}`}>
      {hasTopBorder && <div className={`h-2.5 ${borderColor}`} />}
      <div className="p-6">{children}</div>
    </div>
  );
}
