import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/": "لوحة التحكم",
  "/jobs": "الوظائف",
  "/candidates": "المرشحون",
  "/ai-search": "البحث الذكي — AI",
  "/analytics": "التحليلات",
  "/settings": "الإعدادات",
};

export default function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.self !== window.top || window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/candidate/") ? "ملف المرشح" : "الصفحة");

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${
          collapsed ? "mr-[72px]" : "mr-[260px]"
        }`}
      >
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
            <h1 className="text-lg font-display font-bold text-foreground/90">{title}</h1>
            <div className="text-[11px] font-bold text-muted-foreground/40 tracking-wide">
              ذكاء التوظيف v1.0
            </div>
          </div>
        </header>
        <div className="px-4 sm:px-8 py-4 sm:py-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
