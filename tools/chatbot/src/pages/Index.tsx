import { useState } from "react";
import { MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import AdminPanel from "@/components/AdminPanel";

/**
 * Login is temporarily bypassed.
 * A mock hr_admin user is used so all features (chat + admin panel) are accessible.
 * To re-enable login, restore the LoginScreen import and the `if (!user)` guard.
 */
const MOCK_USER = {
  id: "dev-user",
  username: "dev",
  display_name: "مستخدم تجريبي",
  role: "hr_admin" as const,
};

const ROLE_LABELS: Record<string, string> = {
  hr_admin: "موارد بشرية",
  manager: "مدير",
  general: "موظف",
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "admin">("chat");
  const user = MOCK_USER;

  return (
    <div className="dark flex h-screen flex-col bg-background text-foreground" dir="rtl">
      {/* ── Header Bar: black background per brand guidelines ── */}
      <header className="animate-fade-in flex items-center justify-between bg-black px-6 py-3">
        {/* Right side: Logo + brand name + user info */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 p-1.5 transition-transform duration-200 hover:scale-105">
            <img src={`${import.meta.env.BASE_URL}thamanyah.png`} alt="ثمانية" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold leading-tight text-white">
              مساعد ثمانية الذكي
            </h1>
            <div className="flex items-center gap-2">
              <span className="font-ui text-xs text-white/60">{user.display_name}</span>
              {/* Highlight badge per brand "highlight style" */}
              <span className="rounded-full bg-brand-green/20 px-2 py-0.5 font-ui text-[10px] font-medium text-brand-green">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Left side: Navigation pills */}
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("chat")}
            className={`gap-2 rounded-full font-ui text-xs transition-all duration-200 ${
              activeTab === "chat"
                ? "bg-brand-green text-white hover:bg-brand-green/90"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">المحادثة</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("admin")}
            className={`gap-2 rounded-full font-ui text-xs transition-all duration-200 ${
              activeTab === "admin"
                ? "bg-brand-green text-white hover:bg-brand-green/90"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">الإدارة</span>
          </Button>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <ChatInterface userRole={user.role} userId={user.id} />
        ) : (
          <div className="h-full overflow-auto p-6">
            <div className="mx-auto max-w-2xl animate-fade-in-up">
              <AdminPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
