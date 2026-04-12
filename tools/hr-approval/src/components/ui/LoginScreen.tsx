"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import Button from "./Button";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      const success = login(username, password);
      if (!success) {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-thmanyah-black flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-thmanyah-green blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-thmanyah-blue blur-[120px] animate-float-slow-reverse" />
      </div>

      <div className={`relative w-full max-w-md mx-4 animate-scale-in ${shake ? "animate-shake" : ""}`}>
        {/* Logo + Branding */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-6 animate-float-slow">
            <Image src="/thamanyah.png" alt="ثمانية" width={64} height={64} className="rounded-2xl" />
          </div>
          <h1 className="font-display font-black text-white text-[32px] md:text-[40px] leading-tight mb-3">
            منظومة الشواغر الوظيفية
          </h1>
          <p className="font-body font-bold text-white/40 text-[15px]">
            الشركة الاستثنائية لا تُبنى بالتوظيف الكثير، بل بالتوظيف الصح
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-ui font-bold text-[13px] text-white/60 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(false); }}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pr-11 pl-4 py-3.5 font-ui font-bold text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-thmanyah-green/50 focus:ring-2 focus:ring-thmanyah-green/20 transition-all"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block font-ui font-bold text-[13px] text-white/60 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl pr-11 pl-11 py-3.5 font-ui font-bold text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-thmanyah-green/50 focus:ring-2 focus:ring-thmanyah-green/20 transition-all"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-thmanyah-red/10 border border-thmanyah-red/20 rounded-xl animate-fade-in-up">
                <AlertCircle className="w-4 h-4 text-thmanyah-red shrink-0" />
                <p className="font-ui font-bold text-[13px] text-thmanyah-red">
                  اسم المستخدم أو كلمة المرور غير صحيحة
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              loading={loading}
              className="w-full text-[15px] font-black"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              تسجيل الدخول
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <p className="font-ui font-black text-[12px] text-thmanyah-green mb-3 text-center">
              بيانات الدخول التجريبية
            </p>
            <div className="grid grid-cols-2 gap-2">
              <CredButton
                label="مدير النظام"
                onClick={() => { setUsername("admin"); setPassword("Thmanyah2026!"); setError(false); }}
              />
              <CredButton
                label="زكية حكمي"
                onClick={() => { setUsername("zakiah"); setPassword("Thmanyah2026!"); setError(false); }}
              />
              <CredButton
                label="البراء العوهلي"
                onClick={() => { setUsername("albaraa"); setPassword("Thmanyah2026!"); setError(false); }}
              />
              <CredButton
                label="مستخدم تجريبي"
                onClick={() => { setUsername("demo"); setPassword("demo"); setError(false); }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-lg font-ui font-bold text-[11px] text-white/50 hover:text-white/80 transition-all cursor-pointer"
    >
      {label}
    </button>
  );
}
