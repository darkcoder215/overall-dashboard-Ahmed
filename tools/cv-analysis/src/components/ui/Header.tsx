"use client";

import { useState } from "react";
import { ViewType } from "@/lib/types";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  GitCompareArrows,
  Menu,
  X,
} from "lucide-react";

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: "dashboard", label: "لوحة القيادة", icon: <LayoutDashboard size={18} /> },
  { view: "new-analysis", label: "تحليل جديد", icon: <PlusCircle size={18} /> },
  { view: "history", label: "السجل", icon: <History size={18} /> },
  { view: "compare", label: "مقارنة", icon: <GitCompareArrows size={18} /> },
];

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-thmanyah-warm-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-thmanyah-black flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <img src="/thamanyah.png" alt="ثمانية" className="w-6 h-6 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-[17px] leading-tight text-thmanyah-black">
                تحليل المرشحين
              </h1>
              <p className="text-[11px] text-thmanyah-muted font-ui leading-none">
                Candidate Analysis
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium transition-all duration-200
                  ${
                    currentView === item.view
                      ? "bg-thmanyah-black text-white shadow-md"
                      : "text-thmanyah-charcoal hover:bg-thmanyah-warm-gray"
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-thmanyah-warm-gray transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-thmanyah-warm-border animate-fadeInDown">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all
                  ${
                    currentView === item.view
                      ? "bg-thmanyah-black text-white"
                      : "text-thmanyah-charcoal hover:bg-thmanyah-warm-gray"
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
