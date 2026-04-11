"use client";

import React from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-thmanyah-black text-white hover:bg-thmanyah-charcoal active:bg-thmanyah-dark-slate",
  secondary:
    "bg-white text-thmanyah-black border border-thmanyah-warm-border hover:bg-thmanyah-cream active:bg-thmanyah-warm-gray",
  accent:
    "bg-thmanyah-green text-white hover:bg-emerald-600 active:bg-emerald-700",
  danger:
    "bg-thmanyah-red text-white hover:bg-red-600 active:bg-red-700",
  ghost:
    "bg-transparent text-thmanyah-black hover:bg-thmanyah-cream active:bg-thmanyah-warm-border",
};

const sizes: Record<string, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-2.5 text-[14px]",
  lg: "px-8 py-3 text-[15px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-ui font-bold rounded-full
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer select-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
