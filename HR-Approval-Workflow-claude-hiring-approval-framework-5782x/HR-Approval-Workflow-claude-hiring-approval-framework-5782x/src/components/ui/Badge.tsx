"use client";

import React from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface BadgeProps {
  status: string;
  approverName?: string;
  className?: string;
}

export default function Badge({ status, approverName, className = "" }: BadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.received;
  let label = STATUS_LABELS[status] || status;

  if (status === "pending_approval" && approverName) {
    label = `بانتظار اعتماد ${approverName}`;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        font-ui font-medium text-[12px]
        ${colors.bg} ${colors.text}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
