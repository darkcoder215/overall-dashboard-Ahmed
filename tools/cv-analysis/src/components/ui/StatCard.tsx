"use client";

import { useEffect, useState } from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: "green" | "blue" | "amber" | "red" | "black" | "sky";
  delay?: number;
}

const COLOR_MAP: Record<string, { bg: string; icon: string; text: string }> = {
  green: {
    bg: "bg-thmanyah-green-pale",
    icon: "text-thmanyah-green",
    text: "text-thmanyah-green",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-thmanyah-blue",
    text: "text-thmanyah-blue",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-thmanyah-amber",
    text: "text-thmanyah-amber",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-thmanyah-red",
    text: "text-thmanyah-red",
  },
  black: {
    bg: "bg-thmanyah-warm-gray",
    icon: "text-thmanyah-black",
    text: "text-thmanyah-black",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "text-thmanyah-sky",
    text: "text-thmanyah-sky",
  },
};

export default function StatCard({ icon, label, value, suffix = "", color, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = COLOR_MAP[color];

  useEffect(() => {
    const timer = setTimeout(() => {
      let frame = 0;
      const totalFrames = 30;
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (frame >= totalFrames) {
          clearInterval(interval);
          setDisplayValue(value);
        }
      }, 25);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="glass-card rounded-2xl p-5 hover-lift animate-fadeInUp">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
      </div>
      <div className={`font-display font-black text-[32px] leading-none ${colors.text}`}>
        {displayValue}
        {suffix && <span className="text-[18px] font-bold mr-1">{suffix}</span>}
      </div>
      <p className="text-thmanyah-muted text-[13px] font-ui mt-1.5">{label}</p>
    </div>
  );
}
