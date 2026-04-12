"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Briefcase,
  BarChart3,
  Clock,
  Send,
  CheckCircle2,
  Eye,
  FileText,
  Sparkles,
  Building2,
  Target,
  ChevronDown,
  LogOut,
  FlaskConical,
  Trash2,
  Database,
  Search,
} from "lucide-react";
import Button from "@/components/ui/Button";
import LoginScreen from "@/components/ui/LoginScreen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { APPROVAL_CHAIN_TEMPLATE, SLA_TOTAL } from "@/lib/constants";
import { getAllRequests, getDashboardStats } from "@/lib/store";
import { seedDemoData, hasDemoData, clearAllData } from "@/lib/seedData";

function HomeContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [hasRequests, setHasRequests] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedCount, setSeedCount] = useState(0);

  useEffect(() => {
    const all = getAllRequests();
    setHasRequests(all.length > 0);
    setSeedCount(all.length);
    setSeeded(hasDemoData());
  }, []);

  const handleSeed = () => {
    const data = seedDemoData();
    setSeeded(true);
    setHasRequests(true);
    setSeedCount(data.length);
  };

  const handleClear = () => {
    clearAllData();
    setSeeded(false);
    setHasRequests(false);
    setSeedCount(0);
  };

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-thmanyah-off-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-thmanyah-black border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image src="/thamanyah.png" alt="ثمانية" width={28} height={28} className="rounded-lg" />
            <span className="font-display font-black text-white text-[14px] md:text-[15px] hidden sm:block">ثمانية</span>
          </Link>
          <nav className="flex items-center gap-1 md:gap-2">
            <Link href="/dashboard" className="px-3 md:px-4 py-2 text-[12px] md:text-[13px] font-ui font-bold text-white/85 hover:text-white rounded-full transition-all">
              لوحة المتابعة
            </Link>
            <Link href="/submit">
              <Button variant="accent" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                <span className="hidden sm:inline">تقديم طلب</span>
                <span className="sm:hidden">طلب</span>
              </Button>
            </Link>
            <button
              onClick={logout}
              className="px-2 py-2 text-white/60 hover:text-thmanyah-red rounded-full transition-all cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-thmanyah-black text-white overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-thmanyah-green blur-3xl animate-float-slow" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-thmanyah-blue blur-3xl animate-float-slow-reverse" />
        </div>

        {/* Flying notification bubbles */}
        <div className="absolute inset-0 overflow-hidden hidden md:block">
          {/* Approved */}
          <span className="flying-bubble fly-right bg-thmanyah-green/25 text-thmanyah-green border border-thmanyah-green/50" style={{ top: "18%", right: "8%", "--duration": "11s", "--delay": "0.5s" } as React.CSSProperties}>
            مُعتمد: المبررات واضحة، واضح فكرت بإحسان 👌
          </span>
          <span className="flying-bubble fly-left bg-thmanyah-green/25 text-thmanyah-green border border-thmanyah-green/50" style={{ top: "72%", left: "5%", "--duration": "13s", "--delay": "4s" } as React.CSSProperties}>
            مُعتمد: فريق استقطاب المواهب بطريقه لدعمك 🚀
          </span>
          <span className="flying-bubble fly-up bg-thmanyah-green/25 text-thmanyah-green border border-thmanyah-green/50" style={{ top: "40%", right: "4%", "--duration": "14s", "--delay": "5.5s" } as React.CSSProperties}>
            مُعتمد: دورك كقائد تستثمر في أفضل الكفاءات بعوائد مُستدامة 🔥
          </span>

          {/* Rejected */}
          <span className="flying-bubble fly-left bg-thmanyah-red/25 text-thmanyah-red border border-thmanyah-red/50" style={{ top: "28%", left: "3%", "--duration": "10s", "--delay": "2s" } as React.CSSProperties}>
            مرفوض: الدور ممكن تنفيذه باستخدام أدوات الذكاء الاصطناعي 🤖
          </span>
          <span className="flying-bubble fly-right bg-thmanyah-red/25 text-thmanyah-red border border-thmanyah-red/50" style={{ top: "82%", right: "12%", "--duration": "12s", "--delay": "7s" } as React.CSSProperties}>
            مرفوض: مبررات فتح الشاغر غير مُقنعة، راجع تقرير الرفض 😱
          </span>
          <span className="flying-bubble fly-left bg-thmanyah-red/25 text-thmanyah-red border border-thmanyah-red/50" style={{ top: "55%", left: "15%", "--duration": "9s", "--delay": "1s" } as React.CSSProperties}>
            مرفوض: يؤسفنا رفض طلبك، لعدم توفر ميزانية وبسبب السيولة 💰
          </span>

          {/* Review / pending */}
          <span className="flying-bubble fly-left bg-thmanyah-blue/25 text-thmanyah-sky border border-thmanyah-blue/50" style={{ top: "15%", left: "12%", "--duration": "12s", "--delay": "3s" } as React.CSSProperties}>
            قيد المراجعة: وصلنا طلبك، وحاليًا تحت المراجعة 👀
          </span>
          <span className="flying-bubble fly-up bg-thmanyah-blue/25 text-thmanyah-sky border border-thmanyah-blue/50" style={{ top: "65%", right: "20%", "--duration": "10s", "--delay": "8s" } as React.CSSProperties}>
            في مرحلة الاعتمادات: بانتظار الموافقات النهائية 🫵🏻
          </span>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-10 md:pt-14 pb-10 md:pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-thmanyah-green/20 border border-thmanyah-green/60 rounded-full mb-6 md:mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-thmanyah-green" />
            <span className="font-ui text-[12px] md:text-[13px] text-thmanyah-green font-bold">
              منظومة اعتماد الشواغر الوظيفية
            </span>
          </div>

          <h1 className="font-display font-black text-[32px] md:text-[52px] lg:text-[64px] leading-[1.1] mb-5 md:mb-6 animate-fade-in-up">
            التوظيف الصح
            <br />
            <span className="inline-block bg-thmanyah-green/60 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl">
              يبدأ من هنا
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-fade-in-up mt-8 md:mt-10" style={{ animationDelay: "0.2s" }}>
            <Link href="/submit">
              <Button variant="accent" size="lg" icon={<Send className="w-4 h-4" />} className="text-[14px] md:text-[15px] w-full sm:w-auto font-black">
                تقديم طلب فتح شاغر
              </Button>
            </Link>
            {hasRequests && (
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" icon={<BarChart3 className="w-4 h-4" />} className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 text-[14px] md:text-[15px] w-full sm:w-auto font-black">
                  لوحة المتابعة
                </Button>
              </Link>
            )}
          </div>

          {/* Demo Data Panel */}
          <div className="mt-10 md:mt-14 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            <div className="inline-block bg-white/[0.08] border border-white/25 rounded-2xl p-5 md:p-6 backdrop-blur-sm max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="w-4 h-4 text-thmanyah-amber" />
                <span className="font-ui font-black text-[13px] text-white">بيانات تجريبية</span>
              </div>
              <p className="font-ui text-[12px] text-white/70 mb-4 leading-relaxed">
                أنشئ طلبات تجريبية بمراحل مختلفة (معتمدة، مرفوضة، قيد المعالجة) لاستعراض جميع واجهات المنصة.
              </p>
              {seedCount > 0 && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-thmanyah-green/20 border border-thmanyah-green/50 rounded-xl">
                  <Database className="w-3.5 h-3.5 text-thmanyah-green" />
                  <span className="font-ui font-bold text-[12px] text-thmanyah-green">{seedCount} طلب في النظام</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSeed}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-thmanyah-amber hover:brightness-110 text-thmanyah-black rounded-full font-ui font-black text-[12px] transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  {seedCount > 0 ? "إعادة التعبئة" : "تعبئة البيانات"}
                </button>
                {seedCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-thmanyah-red/30 text-white/90 hover:text-thmanyah-red rounded-full font-ui font-bold text-[12px] transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    مسح
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-8 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white/50 mx-auto" />
          </div>
        </div>
      </section>

      {/* Hiring Pipeline */}
      <section className="py-10 md:py-14 bg-thmanyah-black text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-thmanyah-amber/25 border border-thmanyah-amber/60 rounded-full font-ui text-[12px] text-thmanyah-amber font-bold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              آليّة العمل
            </span>
            <h2 className="font-display font-black text-[26px] md:text-[44px] leading-tight mb-4 max-w-3xl mx-auto">
              يدًا بيد لقرارات تليق{" "}
              <br className="hidden md:block" />
              <span className="inline-block bg-thmanyah-green/60 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl mt-2">
                بثمانية وبناسها
              </span>
            </h2>
            <p className="font-body font-bold text-[14px] md:text-[16px] text-white/75 max-w-2xl mx-auto">
              ٣ مراحل من رفع الطلب إلى قرار التوظيف.
            </p>
          </div>

          {/* Desktop timeline */}
          <div className="hidden md:block relative">
            {/* Dashed connector line (animates right → left) */}
            <svg className="absolute top-[52px] right-0 left-0 w-full h-4 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 4">
              <line x1="80" y1="2" x2="920" y2="2" stroke="#FFBC0A" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" className="pipeline-line" opacity="0.6" />
            </svg>

            <div className="relative grid grid-cols-3 gap-8">
              <PipelineStage
                index={0}
                icon={<FileText className="w-7 h-7" />}
                title="رفع طلب شاغر"
                description="دورك كقائد، ترفع احتياج القوى العاملة في فريقك، وسيُقيم الطلب مبدئيًا بواسطة الذكاء الاصطناعي."
              />
              <PipelineStage
                index={1}
                icon={<Search className="w-7 h-7" />}
                title="تحليل الدور"
                description="بعد التحليل المبدئي، يراجع فريق المواهب طلبك ويرد عليك وفق الخط الزمني المُتفق عليه بالأداة."
              />
              <PipelineStage
                index={2}
                icon={<CheckCircle2 className="w-7 h-7" />}
                title="اتّخاذ القرار"
                description="عند قبول طلبك، يُعين مسؤول الاستقطاب للعمل معك، وفي حال الرفض، نشاركك تقرير واضح."
              />
            </div>
          </div>

          {/* Mobile timeline — vertical */}
          <div className="md:hidden relative space-y-8">
            <div className="absolute top-8 bottom-8 right-7 w-px bg-gradient-to-b from-thmanyah-amber/40 via-thmanyah-amber/20 to-thmanyah-amber/5" />
            {[
              {
                icon: <FileText className="w-5 h-5" />,
                title: "رفع طلب شاغر",
                description: "دورك كقائد، ترفع احتياج القوى العاملة في فريقك، وسيُقيم الطلب مبدئيًا بواسطة الذكاء الاصطناعي.",
              },
              {
                icon: <Search className="w-5 h-5" />,
                title: "تحليل الدور",
                description: "بعد التحليل المبدئي، يراجع فريق المواهب طلبك ويرد عليك وفق الخط الزمني المُتفق عليه بالأداة.",
              },
              {
                icon: <CheckCircle2 className="w-5 h-5" />,
                title: "اتّخاذ القرار",
                description: "عند قبول طلبك، يُعين مسؤول الاستقطاب للعمل معك، وفي حال الرفض، نشاركك تقرير واضح.",
              },
            ].map((s, i) => (
              <div key={i} className="relative flex items-start gap-4 pipeline-node-enter" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="relative z-10 w-14 h-14 rounded-full bg-thmanyah-amber flex items-center justify-center text-thmanyah-black shrink-0 shadow-[0_0_0_4px_rgba(250,204,21,0.12)]">
                  {s.icon}
                </div>
                <div className="flex-1 pt-1.5">
                  <h3 className="font-display font-black text-[17px] text-thmanyah-amber mb-1.5">{s.title}</h3>
                  <p className="font-ui text-[12px] text-white/85 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom key message */}
          <div className="mt-10 md:mt-14 text-center max-w-2xl mx-auto">
            <div className="inline-block bg-thmanyah-amber/20 border-2 border-thmanyah-amber/70 rounded-2xl px-6 md:px-8 py-4 md:py-5">
              <p className="font-display font-black text-[15px] md:text-[17px] text-thmanyah-amber leading-relaxed">
                جودة قراراتك = كفاءة فريقك. كيف سترفع من جودة قراراتك في اختيار أفضل المواهب؟
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approval chain */}
      <section className="py-10 md:py-14 bg-thmanyah-off-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-thmanyah-black rounded-full font-ui text-[12px] text-thmanyah-amber font-bold mb-4">
              <Building2 className="w-3.5 h-3.5" />
              كيف نعتمد؟
            </span>
            <h2 className="font-display font-black text-[26px] md:text-[40px] mb-3 text-thmanyah-black">
              <span className="inline-block bg-thmanyah-green text-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl">
                6 مراحل
              </span>
              {" — "}
              {SLA_TOTAL}
            </h2>
            <p className="font-body font-bold text-[14px] md:text-[16px] text-thmanyah-charcoal">
              كل مرحلة لها مسؤول محدد ومهلة زمنية واضحة
            </p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto stagger-children">
            {APPROVAL_CHAIN_TEMPLATE.map((step, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4 bg-white rounded-2xl p-4 md:p-5 border border-thmanyah-warm-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover-lift">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-thmanyah-black text-thmanyah-amber flex items-center justify-center font-display font-black text-[14px] md:text-[16px] shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui font-black text-[14px] md:text-[15px] text-thmanyah-black">{step.role}</p>
                  {step.approverName && step.role !== "الرئيس التنفيذي" && (
                    <p className="font-ui font-bold text-[12px] md:text-[13px] text-thmanyah-charcoal mt-0.5 truncate">{step.approverName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-thmanyah-black rounded-full shrink-0">
                  <Clock className="w-3 md:w-3.5 h-3 md:h-3.5 text-thmanyah-amber" />
                  <span className="font-ui font-black text-[12px] md:text-[13px] text-thmanyah-amber">{step.slaHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 md:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-display font-black text-[26px] md:text-[40px] text-thmanyah-black">
              <span className="inline-block bg-thmanyah-green text-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl">
                كيف صممنا الأداة؟
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 stagger-children">
            <FeatureCard icon={<Target className="w-5 h-5" />} title="أسئلة متكيّفة" description="النموذج يتكيّف مع إجاباتك ويعرض أسئلة مختلفة حسب نوع الشاغر" />
            <FeatureCard icon={<Eye className="w-5 h-5" />} title="تتبع لحظي" description="اعرف وين وصل طلبك بالضبط مع شريط تقدم بصري واضح" />
            <FeatureCard icon={<BarChart3 className="w-5 h-5" />} title="لوحة تحليلية" description="إحصائيات شاملة حسب الإدارة مع نسب القبول والرفض" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-thmanyah-dark-slate text-white/75 py-6 md:py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/thamanyah.png" alt="ثمانية" width={20} height={20} className="rounded" />
            <span className="font-ui font-bold text-[11px] md:text-[12px]">إدارة المواهب</span>
          </div>
          <span className="font-ui font-bold text-[11px] md:text-[12px]">{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-thmanyah-off-white border border-thmanyah-warm-border rounded-2xl p-5 md:p-6 hover-lift">
      <div className="w-11 h-11 rounded-xl bg-thmanyah-green flex items-center justify-center mb-4 text-white shadow-[0_4px_12px_rgba(0,193,122,0.25)]">{icon}</div>
      <h3 className="font-ui font-black text-[14px] md:text-[15px] mb-2 text-thmanyah-black">{title}</h3>
      <p className="font-ui font-bold text-[12px] md:text-[13px] text-thmanyah-charcoal leading-relaxed">{description}</p>
    </div>
  );
}

function PipelineStage({
  index,
  icon,
  title,
  description,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative group pipeline-node-enter text-center"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Node circle */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="pipeline-node w-[104px] h-[104px] rounded-full bg-thmanyah-amber flex items-center justify-center text-thmanyah-black shadow-[0_0_0_6px_rgba(250,204,21,0.08)] transition-transform duration-500 group-hover:scale-[1.04]">
            {icon}
          </div>
          {/* Stage number badge */}
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-thmanyah-black border-2 border-thmanyah-amber text-thmanyah-amber font-display font-black text-[12px] flex items-center justify-center">
            {index + 1}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-black text-[19px] md:text-[21px] text-thmanyah-amber mb-3 leading-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="font-ui font-bold text-[13px] md:text-[14px] text-white/85 leading-[1.8] max-w-[280px] mx-auto">
        {description}
      </p>
    </div>
  );
}
