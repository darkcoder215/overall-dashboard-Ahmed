"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]
        ${paddings[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
