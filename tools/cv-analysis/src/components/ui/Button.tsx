"use client";

import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-thmanyah-black text-white hover:bg-thmanyah-dark-slate active:bg-thmanyah-charcoal shadow-sm",
  secondary:
    "bg-white text-thmanyah-charcoal border border-thmanyah-warm-border hover:bg-thmanyah-cream active:bg-thmanyah-warm-gray",
  accent:
    "bg-thmanyah-green text-white hover:brightness-110 active:brightness-95 shadow-sm",
  danger:
    "bg-thmanyah-red text-white hover:brightness-110 active:brightness-95",
  ghost:
    "bg-transparent text-thmanyah-charcoal hover:bg-thmanyah-warm-gray active:bg-thmanyah-warm-border",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px] rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-[14px] rounded-xl gap-2",
  lg: "px-7 py-3.5 text-[16px] rounded-2xl gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-ui font-bold
        transition-all duration-200
        disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : size === "lg" ? 20 : 16} className="animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
