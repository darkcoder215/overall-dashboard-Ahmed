import { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface AppUser {
  id: string;
  username: string;
  display_name: string;
  role: "hr_admin" | "manager" | "general";
}

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/authenticate`;

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "فشل تسجيل الدخول");
        return;
      }

      toast.success(`مرحباً ${data.user.display_name}`);
      onLogin(data.user);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] p-4" dir="rtl">
      {/* Decorative background pattern — subtle brand touch */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-green/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-blue/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Card with Thmanyah brand styling: white bg, rounded-2xl, subtle shadow */}
        <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-lg)]">
          {/* Logo + Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-black p-3 transition-transform duration-300 hover:scale-105"
            >
              {/* Icon logo on dark background per brand guidelines */}
              <img src="/thamanyah.png" alt="ثمانية" className="h-full w-full object-contain" />
            </div>
            <h1 className="font-display text-2xl font-bold text-black">
              مساعد ثمانية الذكي
            </h1>
            <p className="mt-1 font-ui text-sm text-[#494C6B]">
              سجّل دخولك للمتابعة
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                disabled={isLoading}
                autoComplete="username"
                className="h-12 rounded-xl border-[#EFEDE2] bg-[#F7F4EE] font-ui text-sm placeholder:text-[#494C6B]/60 focus:border-brand-green focus:ring-brand-green"
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                disabled={isLoading}
                autoComplete="current-password"
                className="h-12 rounded-xl border-[#EFEDE2] bg-[#F7F4EE] font-ui text-sm placeholder:text-[#494C6B]/60 focus:border-brand-green focus:ring-brand-green"
              />
            </div>

            {error && (
              <p className="animate-fade-in rounded-lg bg-brand-red/10 px-3 py-2 text-center font-ui text-sm text-brand-red">
                {error}
              </p>
            )}

            {/* Primary button: pill shape, black bg per brand guidelines */}
            <Button
              type="submit"
              className="h-12 w-full gap-2 rounded-full bg-black font-ui text-sm font-bold text-white transition-all duration-200 hover:bg-[#2B2D3F] hover:shadow-md disabled:opacity-50"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              تسجيل الدخول
            </Button>
          </form>
        </div>

        {/* Brand footer */}
        <p className="mt-6 text-center font-ui text-xs text-[#494C6B]/60">
          ثمانية — إثراء المحتوى العربي
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
