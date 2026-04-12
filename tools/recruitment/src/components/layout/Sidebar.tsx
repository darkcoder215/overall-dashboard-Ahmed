import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/jobs", icon: Briefcase, label: "الوظائف" },
  { to: "/candidates", icon: Users, label: "المرشحون" },
  { to: "/ai-search", icon: Sparkles, label: "البحث الذكي" },
  { to: "/analytics", icon: BarChart3, label: "التحليلات" },
  { to: "/settings", icon: Settings, label: "الإعدادات" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 right-0 h-screen bg-black z-50 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-lg bg-white/10 p-1.5">
          <img
            src={`${import.meta.env.BASE_URL}thamanyah.png`}
            alt="ثمانية"
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-base font-bold text-white font-display">ثمانية</h1>
            <p className="text-[10px] text-white/50 font-ui">ذكاء التوظيف</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-brand-green/15 text-brand-green"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-green rounded-l-full" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                )}
                {item.to === "/ai-search" && !collapsed && (
                  <span className="mr-auto text-[9px] font-bold bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded-full">
                    AI
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="p-3 mx-2 mb-4 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  );
}
