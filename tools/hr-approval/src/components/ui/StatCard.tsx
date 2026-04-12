"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "green" | "amber" | "red" | "blue" | "black";
}

const colorMap = {
  green: "bg-thmanyah-green-light/30 text-thmanyah-green",
  amber: "bg-thmanyah-pale-yellow/40 text-amber-600",
  red: "bg-red-50 text-thmanyah-red",
  blue: "bg-thmanyah-sky/20 text-thmanyah-blue",
  black: "bg-thmanyah-cream text-thmanyah-black",
};

export default function StatCard({
  label,
  value,
  icon,
  color = "black",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="font-display font-black text-[28px] leading-none">
          {value}
        </p>
        <p className="font-ui text-[13px] text-thmanyah-muted mt-1">{label}</p>
      </div>
    </div>
  );
}
