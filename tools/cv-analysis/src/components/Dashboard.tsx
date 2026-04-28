"use client";

import { useEffect, useState } from "react";
import { CandidateAnalysis } from "@/lib/types";
import { getAllCandidates, getStats } from "@/lib/storage";
import { seedDemoCandidatesIfEmpty } from "@/lib/demo-data";
import { DECISION_CONFIG, getScoreColor } from "@/lib/constants";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import {
  Users,
  TrendingUp,
  Clock,
  Trophy,
  PlusCircle,
  ChevronLeft,
  FileText,
  Video,
  Sparkles,
} from "lucide-react";

interface DashboardProps {
  onNewAnalysis: () => void;
  onViewCandidate: (id: string) => void;
}

export default function Dashboard({ onNewAnalysis, onViewCandidate }: DashboardProps) {
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    seedDemoCandidatesIfEmpty();
    setCandidates(getAllCandidates());
    setStats(getStats());
  }, []);

  const recentCandidates = candidates.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section */}
      <div className="relative gradient-hero rounded-3xl p-8 sm:p-12 mb-8 overflow-hidden animate-fadeIn">
        {/* Decorative Orbs */}
        <div className="orb orb-green w-64 h-64 -top-20 -left-20" />
        <div className="orb orb-sky w-48 h-48 -bottom-16 -right-16" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 animate-fadeInUp">
            <div className="w-12 h-12 rounded-2xl gradient-green flex items-center justify-center shadow-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-[28px] sm:text-[36px] text-thmanyah-black leading-tight">
                تحليل المرشحين
              </h1>
              <p className="font-body text-[14px] text-thmanyah-muted">
                بالذكاء الاصطناعي — اتخذ القرار الصحيح
              </p>
            </div>
          </div>

          <p className="font-body text-[16px] text-thmanyah-charcoal max-w-xl leading-relaxed mb-6 animate-fadeInUp stagger-2">
            حلّل السير الذاتية ومقاطع الفيديو التعريفية للمرشحين باستخدام الذكاء الاصطناعي.
            احصل على تقييم شامل ومتعدد الأبعاد يساعدك في اتخاذ قرار التوظيف المناسب.
          </p>

          <Button
            variant="primary"
            size="lg"
            icon={<PlusCircle size={20} />}
            onClick={onNewAnalysis}
            className="animate-fadeInUp stagger-3"
          >
            تحليل مرشح جديد
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users size={20} />}
          label="إجمالي المرشحين"
          value={stats.total}
          color="black"
          delay={100}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="متوسط التقييم"
          value={stats.avgScore}
          suffix="%"
          color="green"
          delay={200}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="قيد المراجعة"
          value={stats.decisions.pending}
          color="amber"
          delay={300}
        />
        <StatCard
          icon={<Trophy size={20} />}
          label="تم قبولهم"
          value={stats.decisions.strong_hire + stats.decisions.hire}
          color="blue"
          delay={400}
        />
      </div>

      {/* Recent Analyses */}
      {recentCandidates.length > 0 ? (
        <div className="animate-fadeInUp stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-[20px] text-thmanyah-black">
              آخر التحليلات
            </h2>
            {candidates.length > 6 && (
              <button
                onClick={() => {}}
                className="text-thmanyah-green text-[14px] font-bold flex items-center gap-1 hover:underline"
              >
                عرض الكل
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCandidates.map((candidate, i) => (
              <CandidatePreviewCard
                key={candidate.id}
                candidate={candidate}
                index={i}
                onClick={() => onViewCandidate(candidate.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeInUp stagger-4">
          <div className="w-20 h-20 rounded-3xl bg-thmanyah-green-pale flex items-center justify-center mx-auto mb-6">
            <FileText size={36} className="text-thmanyah-green" />
          </div>
          <h3 className="font-display font-bold text-[22px] text-thmanyah-black mb-2">
            لا توجد تحليلات بعد
          </h3>
          <p className="font-body text-[15px] text-thmanyah-muted max-w-md mx-auto mb-6">
            ابدأ بتحليل أول مرشح — ارفع السيرة الذاتية وسيقوم الذكاء الاصطناعي بتقييم شامل
          </p>
          <Button variant="accent" size="lg" icon={<PlusCircle size={20} />} onClick={onNewAnalysis}>
            ابدأ أول تحليل
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      {candidates.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeInUp stagger-6">
          <button
            onClick={onNewAnalysis}
            className="glass-card rounded-2xl p-5 text-right hover-lift group"
          >
            <div className="w-10 h-10 rounded-xl bg-thmanyah-green-pale flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusCircle size={20} className="text-thmanyah-green" />
            </div>
            <h4 className="font-ui font-bold text-[15px] text-thmanyah-black">تحليل جديد</h4>
            <p className="text-[12px] text-thmanyah-muted mt-1">ارفع سيرة ذاتية أو فيديو</p>
          </button>

          <button
            onClick={() => {}}
            className="glass-card rounded-2xl p-5 text-right hover-lift group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Video size={20} className="text-thmanyah-blue" />
            </div>
            <h4 className="font-ui font-bold text-[15px] text-thmanyah-black">تحليل فيديو</h4>
            <p className="text-[12px] text-thmanyah-muted mt-1">قيّم مقطع الفيديو التعريفي</p>
          </button>

          <button
            onClick={() => {}}
            className="glass-card rounded-2xl p-5 text-right hover-lift group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles size={20} className="text-thmanyah-amber" />
            </div>
            <h4 className="font-ui font-bold text-[15px] text-thmanyah-black">تحليل شامل</h4>
            <p className="text-[12px] text-thmanyah-muted mt-1">سيرة ذاتية + فيديو معاً</p>
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Candidate Preview Card ──────────────── */
function CandidatePreviewCard({
  candidate,
  index,
  onClick,
}: {
  candidate: CandidateAnalysis;
  index: number;
  onClick: () => void;
}) {
  const decision = DECISION_CONFIG[candidate.decision];
  const scoreColor = getScoreColor(candidate.combinedScore);
  const date = new Date(candidate.createdAt);
  const dateStr = date.toLocaleDateString("ar-SA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-right hover-lift animate-fadeInUp w-full"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-[18px] text-white"
            style={{ backgroundColor: scoreColor }}
          >
            {candidate.candidateName.charAt(0)}
          </div>
          <div>
            <h4 className="font-ui font-bold text-[15px] text-thmanyah-black leading-tight">
              {candidate.candidateName}
            </h4>
            <p className="text-[12px] text-thmanyah-muted">{candidate.roleContext.roleTitle}</p>
          </div>
        </div>
        <div
          className="font-display font-black text-[24px] leading-none"
          style={{ color: scoreColor }}
        >
          {candidate.combinedScore}
        </div>
      </div>

      {/* Score Bar */}
      <div className="w-full h-2 bg-thmanyah-warm-border rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${candidate.combinedScore}%`,
            backgroundColor: scoreColor,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-bold px-2.5 py-1 rounded-lg ${decision.bgColor} ${decision.color} ${decision.borderColor} border`}>
          {decision.label}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-thmanyah-muted">
          {candidate.cvFileName && <FileText size={12} />}
          {candidate.videoFileName && <Video size={12} />}
          <span>{dateStr}</span>
        </div>
      </div>
    </button>
  );
}
