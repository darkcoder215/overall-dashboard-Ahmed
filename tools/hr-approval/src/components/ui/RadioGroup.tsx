"use client";

import React from "react";

interface RadioGroupProps {
  label: string;
  hint?: string;
  name: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export default function RadioGroup({
  label,
  hint,
  name,
  options,
  value,
  onChange,
  required,
  error,
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-ui font-medium text-[14px] text-thmanyah-black">
        {label}
        {required && <span className="text-thmanyah-red mr-1">*</span>}
      </p>
      {hint && (
        <p className="text-[13px] text-thmanyah-muted font-ui leading-relaxed">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`
              flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer
              border transition-all duration-200 select-none
              ${
                value === opt.value
                  ? "border-thmanyah-green bg-thmanyah-green-light/20 ring-2 ring-thmanyah-green/20"
                  : "border-thmanyah-warm-border bg-white hover:border-thmanyah-muted/40"
              }
            `}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${
                  value === opt.value
                    ? "border-thmanyah-green"
                    : "border-thmanyah-warm-border"
                }
              `}
            >
              {value === opt.value && (
                <span className="w-2.5 h-2.5 rounded-full bg-thmanyah-green" />
              )}
            </span>
            <div>
              <span className="font-ui font-medium text-[14px]">
                {opt.label}
              </span>
              {opt.description && (
                <p className="text-[12px] text-thmanyah-muted mt-0.5">
                  {opt.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-[12px] text-thmanyah-red font-ui">{error}</p>
      )}
    </div>
  );
}
