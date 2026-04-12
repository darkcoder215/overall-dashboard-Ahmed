"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function Input({
  label,
  hint,
  error,
  id,
  className = "",
  required,
  ...props
}: InputProps) {
  const inputId = id || label.replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-ui font-medium text-[14px] text-thmanyah-black"
      >
        {label}
        {required && <span className="text-thmanyah-red mr-1">*</span>}
      </label>
      {hint && (
        <p className="text-[13px] text-thmanyah-muted font-ui leading-relaxed">
          {hint}
        </p>
      )}
      <input
        id={inputId}
        required={required}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-white border border-thmanyah-warm-border
          font-ui text-[14px] text-thmanyah-black
          placeholder:text-thmanyah-muted/50
          transition-all duration-200
          hover:border-thmanyah-muted/40
          focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20
          focus:outline-none
          ${error ? "border-thmanyah-red ring-2 ring-thmanyah-red/20" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-[12px] text-thmanyah-red font-ui">{error}</p>
      )}
    </div>
  );
}
