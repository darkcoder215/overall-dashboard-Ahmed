"use client";

import { useEffect, useState } from "react";
import { getScoreColor } from "@/lib/constants";

interface ScoreRadialProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  animated?: boolean;
  delay?: number;
}

export default function ScoreRadial({
  score,
  maxScore = 100,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  animated = true,
  delay = 0,
}: ScoreRadialProps) {
  const [currentScore, setCurrentScore] = useState(animated ? 0 : score);
  const percentage = (currentScore / maxScore) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getScoreColor((score / maxScore) * 100);

  useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => {
      let frame = 0;
      const totalFrames = 40;
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrentScore(Math.round(score * eased));
        if (frame >= totalFrames) {
          clearInterval(interval);
          setCurrentScore(score);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, animated, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-thmanyah-warm-border)"
            strokeWidth={strokeWidth}
          />
          {/* Score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: animated ? "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-black leading-none"
            style={{ fontSize: size * 0.28, color }}
          >
            {currentScore}
          </span>
          {maxScore !== 100 && (
            <span className="text-thmanyah-muted font-ui" style={{ fontSize: size * 0.11 }}>
              / {maxScore}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="font-ui font-bold text-[14px] text-thmanyah-charcoal text-center">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="font-ui text-[12px] text-thmanyah-muted text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
}
