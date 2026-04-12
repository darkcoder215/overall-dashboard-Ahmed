"use client";

import { useEffect, useState } from "react";
import { CandidateAnalysis, CandidateDecision } from "@/lib/types";
import { getAllCandidates } from "@/lib/storage";
import { DECISION_CONFIG, getScoreColor } from "@/lib/constants";
import Button from "@/components/ui/Button";
import {
  Search,
  Filter,
  FileText,
  Video,
  SortDesc,
  Users,
  PlusCircle,
} from "lucide-react";

interface HistoryViewProps {
  onViewCandidate: (id: string) => void;
  onNewAnalysis: () => void;
}

type SortBy = "date" | "score" | "name";
type FilterDecision = "all" | CandidateDecision;

export default function HistoryView({ onViewCandidate, onNewAnalysis }: HistoryViewProps) {
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterDecision, setFilterDecision] = useState<FilterDecision>("all");

  useEffect(() => {
    setCandidates(getAllCandidates());
  }, []);

  const filtered = candidates
    .filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.candidateName.toLowerCase().includes(q) ||
          c.roleContext.roleTitle.toLowerCase().includes(q) ||
          c.roleContext.department.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .filter((c) => {
      if (filterDecision === "all") return true;
      return c.decision === filterDecision;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "score") return b.combinedScore - a.combinedScore;
      return a.candidateName.localeCompare(b.candidateName, "ar");
    });

  const FILTER_OPTIONS: { value: FilterDecision; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "strong_hire", label: "توظيف فوري" },
    { value: "hire", label: "توظيف" },
    { value: "maybe", label: "مقابلة إضافية" },
    { value: "no_hire", label: "غير مناسب" },
    { value: "pending", label: "قيد المراجعة" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fadeIn">
        <div>
          <h1 className="font-display font-bold text-[24px] text-thmanyah-black">
            سجل التحليلات
          </h1>
          <p className="text-[14px] text-thmanyah-muted">
            {candidates.length} مرشح &middot; جميع التحليلات السابقة
          </p>
        </div>
        <Button variant="accent" icon={<PlusCircle size={18} />} onClick={onNewAnalysis}>
          تحليل جديد
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4 mb-6 animate-fadeInUp stagger-1">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-thmanyah-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المرشح، الدور، أو الإدارة..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-thmanyah-muted shrink-0" />
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value as FilterDecision)}
              className="px-3 py-2.5 rounded-xl border border-thmanyah-warm-border bg-white text-[13px] focus:border-thmanyah-green outline-none"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortDesc size={16} className="text-thmanyah-muted shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2.5 rounded-xl border border-thmanyah-warm-border bg-white text-[13px] focus:border-thmanyah-green outline-none"
            >
              <option value="date">الأحدث</option>
              <option value="score">الأعلى تقييماً</option>
              <option value="name">الاسم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((candidate, i) => {
            const decision = DECISION_CONFIG[candidate.decision];
            const scoreColor = getScoreColor(candidate.combinedScore);
            const dateStr = new Date(candidate.createdAt).toLocaleDateString("ar-SA", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <button
                key={candidate.id}
                onClick={() => onViewCandidate(candidate.id)}
                className="w-full glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover-lift text-right animate-fadeInUp"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Score Badge */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-[22px] text-white shrink-0"
                  style={{ backgroundColor: scoreColor }}
                >
                  {candidate.combinedScore}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-ui font-bold text-[15px] text-thmanyah-black truncate">
                      {candidate.candidateName}
                    </h3>
                    <span
                      className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md border ${decision.bgColor} ${decision.color} ${decision.borderColor}`}
                    >
                      {decision.label}
                    </span>
                  </div>
                  <p className="text-[13px] text-thmanyah-muted truncate">
                    {candidate.roleContext.roleTitle} &middot; {candidate.roleContext.department}
                  </p>
                </div>

                {/* Meta */}
                <div className="hidden sm:flex items-center gap-3 text-thmanyah-muted shrink-0">
                  {candidate.cvFileName && <FileText size={16} />}
                  {candidate.videoFileName && <Video size={16} />}
                  <span className="text-[12px]">{dateStr}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : candidates.length > 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeIn">
          <Search size={36} className="mx-auto text-thmanyah-muted mb-4" />
          <h3 className="font-display font-bold text-[18px] text-thmanyah-black mb-2">
            لا توجد نتائج
          </h3>
          <p className="text-[14px] text-thmanyah-muted">
            جرّب تعديل البحث أو تغيير الفلتر
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeIn">
          <Users size={36} className="mx-auto text-thmanyah-muted mb-4" />
          <h3 className="font-display font-bold text-[18px] text-thmanyah-black mb-2">
            السجل فارغ
          </h3>
          <p className="text-[14px] text-thmanyah-muted mb-6">
            ابدأ بتحليل أول مرشح لبناء سجل التحليلات
          </p>
          <Button variant="accent" icon={<PlusCircle size={18} />} onClick={onNewAnalysis}>
            تحليل مرشح جديد
          </Button>
        </div>
      )}
    </div>
  );
}
