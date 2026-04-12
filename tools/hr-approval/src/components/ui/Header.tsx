"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-thmanyah-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0">
          <Image
            src="/thamanyah.png"
            alt="ثمانية"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="font-display font-black text-white text-[13px] md:text-[15px] tracking-tight hidden sm:block">
            نموذج طلب فتح شاغر وظيفي
          </span>
          <span className="font-display font-black text-white text-[13px] sm:hidden">
            ثمانية
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-4 py-2 text-[13px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            الرئيسية
          </Link>
          <Link
            href="/submit"
            className="px-4 py-2 text-[13px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            تقديم طلب
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-[13px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            لوحة المتابعة
          </Link>
          {user?.username === "admin" && (
            <Link
              href="/settings"
              className="px-3 py-2 text-[12px] font-ui font-bold text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              الإعدادات
            </Link>
          )}
          {user && (
            <button
              onClick={logout}
              className="px-3 py-2 text-[12px] font-ui font-bold text-white/40 hover:text-thmanyah-red hover:bg-white/5 rounded-full transition-all flex items-center gap-1.5 mr-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-thmanyah-dark-slate border-t border-white/10 animate-slide-down">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <MobileLink href="/" onClick={() => setMobileOpen(false)}>الرئيسية</MobileLink>
            <MobileLink href="/submit" onClick={() => setMobileOpen(false)}>تقديم طلب</MobileLink>
            <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>لوحة المتابعة</MobileLink>
            {user?.username === "admin" && (
              <MobileLink href="/settings" onClick={() => setMobileOpen(false)}>الإعدادات</MobileLink>
            )}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="px-4 py-3 text-[14px] font-ui font-bold text-thmanyah-red/70 hover:text-thmanyah-red hover:bg-white/5 rounded-xl transition-all text-right flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 text-[14px] font-ui font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
    >
      {children}
    </Link>
  );
}
