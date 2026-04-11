"use client";

import React from "react";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}

export default function FormSection({
  title,
  subtitle,
  icon,
  children,
  highlight = false,
}: FormSectionProps) {
  return (
    <div
      className={`
        rounded-2xl overflow-hidden
        ${highlight ? "border-2 border-thmanyah-green/20" : ""}
      `}
    >
      <div
        className={`
          px-6 py-4 flex items-center gap-3
          ${highlight ? "bg-thmanyah-green-light/20" : "bg-thmanyah-cream"}
        `}
      >
        {icon && (
          <span className="text-thmanyah-green shrink-0">{icon}</span>
        )}
        <div>
          <h3 className="font-display font-bold text-[18px] text-thmanyah-black">
            {title}
          </h3>
          {subtitle && (
            <p className="font-ui text-[13px] text-thmanyah-muted mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="bg-white p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}
