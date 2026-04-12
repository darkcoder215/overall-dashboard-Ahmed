"use client";

import React from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { ApprovalStep } from "@/lib/types";

interface ApprovalStepperProps {
  steps: ApprovalStep[];
  currentStep: number;
  isRejected: boolean;
}

export default function ApprovalStepper({
  steps,
  currentStep,
  isRejected,
}: ApprovalStepperProps) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, index) => {
        const isActive = index === currentStep && !isRejected;
        const isCompleted = step.status === "approved";
        const isRejectedStep = step.status === "rejected";
        const isPending = step.status === "pending" && index !== currentStep;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  transition-all duration-300
                  ${
                    isCompleted
                      ? "bg-thmanyah-green text-white"
                      : isRejectedStep
                      ? "bg-thmanyah-red text-white"
                      : isActive
                      ? "bg-thmanyah-amber text-white animate-pulse-soft"
                      : "bg-thmanyah-warm-border text-thmanyah-muted"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isRejectedStep ? (
                  <X className="w-5 h-5" />
                ) : isActive ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <span className="font-ui font-bold text-[14px]">
                    {index + 1}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-0.5 h-16 transition-colors duration-300
                    ${
                      isCompleted
                        ? "bg-thmanyah-green"
                        : isRejectedStep
                        ? "bg-thmanyah-red/30"
                        : "bg-thmanyah-warm-border"
                    }
                  `}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 pt-1.5 ${index === steps.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={`font-ui font-bold text-[14px] ${
                    isActive
                      ? "text-thmanyah-black"
                      : isCompleted
                      ? "text-thmanyah-green"
                      : isRejectedStep
                      ? "text-thmanyah-red"
                      : "text-thmanyah-muted"
                  }`}
                >
                  {step.role}
                </h4>
                <span
                  className={`
                    text-[12px] font-ui px-2 py-0.5 rounded-full
                    ${
                      isCompleted
                        ? "bg-thmanyah-green-light/30 text-emerald-700"
                        : isRejectedStep
                        ? "bg-red-50 text-red-700"
                        : isActive
                        ? "bg-thmanyah-pale-yellow/40 text-amber-700"
                        : "bg-thmanyah-cream text-thmanyah-muted"
                    }
                  `}
                >
                  {isCompleted
                    ? "موافق"
                    : isRejectedStep
                    ? "مرفوض"
                    : isActive
                    ? `بانتظار الاعتماد — ${step.slaHours} ساعة`
                    : "في الانتظار"}
                </span>
              </div>
              <p className="text-[13px] text-thmanyah-muted font-ui mt-1">
                {step.approverName || "لم يُحدد بعد"}
              </p>
              {step.decidedAt && (
                <p className="text-[12px] text-thmanyah-muted/70 font-ui mt-1">
                  {new Date(step.decidedAt).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {step.comment && (
                <div className={`mt-2 p-3 rounded-xl text-[13px] font-ui ${
                  isRejectedStep ? "bg-red-50 text-red-800" : "bg-thmanyah-cream text-thmanyah-charcoal"
                }`}>
                  {step.comment}
                </div>
              )}
              {isActive && !isRejected && (
                <div className="flex items-center gap-1.5 mt-2 text-thmanyah-amber">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-ui font-medium">
                    SLA: {step.slaHours} ساعة عمل
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
