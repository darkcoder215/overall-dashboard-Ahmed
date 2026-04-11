"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  hint,
  error,
  options,
  placeholder = "اختر...",
  id,
  required,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || label.replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
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
      <div className="relative">
        <select
          id={selectId}
          required={required}
          className={`
            w-full px-4 py-3 rounded-xl appearance-none
            bg-white border border-thmanyah-warm-border
            font-ui text-[14px] text-thmanyah-black
            transition-all duration-200
            hover:border-thmanyah-muted/40
            focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20
            focus:outline-none cursor-pointer
            ${error ? "border-thmanyah-red ring-2 ring-thmanyah-red/20" : ""}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thmanyah-muted pointer-events-none" />
      </div>
      {error && (
        <p className="text-[12px] text-thmanyah-red font-ui">{error}</p>
      )}
    </div>
  );
}
