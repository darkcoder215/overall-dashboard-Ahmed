"use client";

import { useEffect, useState } from "react";
import { CandidateAnalysis } from "@/lib/types";
import { getAllCandidates } from "@/lib/storage";
import { DECISION_CONFIG, getScoreColor, getScoreLabel } from "@/lib/constants";
import ScoreRadial from "@/components/ui/ScoreRadial";
import Button from "@/components/ui/Button";
import {
  Users,
  PlusCircle,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Trophy,
} from "lucide-react";

interface CompareViewProps {
  onViewCandidate: (id: string) => void;
  onNewAnalysis: () => void;
}

export default function CompareView({ onViewCandidate, onNewAnalysis }: CompareViewProps) {
  const [allCandidates, setAllCandidates] = useState<CandidateAnalysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const candidates = getAllCandidates().filter((c) => c.status === "completed");
    setAllCandidates(candidates);
  }, []);

  const selectedCandidates = selectedIds
    .map((id) => allCandidates.find((c) => c.id === id))
    .filter(Boolean) as CandidateAnalysis[];

  const addCandidate = (id: string) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
    setShowPicker(false);
  };

  const removeCandidate = (id: string) => {
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
  };

  const availableCandidates = allCandidates.filter((c) => !selectedIds.includes(c.id));

  // Get dimension names from first candidate
  const dimensionNames =
    selectedCandidates[0]?.cvAnalysis?.dimensions.map((d) => d.name) || [];

  // Find best candidate by combined score
  const bestId =
    selectedCandidates.length > 1
      ? selectedCandidates.reduce((best, c) => (c.combinedScore > best.combinedScore ? c : best))
          .id
      : null;

  if (allCandidates.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeIn">
          <Users size={40} className="mx-auto text-thmanyah-muted mb-4" />
          <h3 className="font-display font-bold text-[22px] text-thmanyah-black mb-2">
            لا يمكن المقارنة بعد
          </h3>
          <p className="text-[14px] text-thmanyah-muted mb-6">
            تحتاج إلى تحليل مرشحَين على الأقل للمقارنة بينهم
          </p>
          <Button variant="accent" icon={<PlusCircle size={18} />} onClick={onNewAnalysis}>
            تحليل مرشح جديد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fadeIn">
        <div>
          <h1 className="font-display font-bold text-[24px] text-thmanyah-black">
            مقارنة المرشحين
          </h1>
          <p className="text-[14px] text-thmanyah-muted">
            قارن حتى 3 مرشحين جنباً إلى جنب
          </p>
        </div>
      </div>

      {/* Selection Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 animate-fadeInUp">
        <div className="flex flex-wrap items-center gap-3">
          {selectedCandidates.map((c) => {
            const color = getScoreColor(c.combinedScore);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 bg-thmanyah-cream rounded-xl px-3 py-2"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[14px]"
                  style={{ backgroundColor: color }}
                >
                  {c.combinedScore}
                </div>
                <span className="text-[13px] font-bold text-thmanyah-black">
                  {c.candidateName}
                </span>
                <button
                  onClick={() => removeCandidate(c.id)}
                  className="p-1 rounded-md hover:bg-red-50 text-thmanyah-muted hover:text-thmanyah-red transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}

          {selectedIds.length < 3 && (
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-thmanyah-warm-border text-[13px] text-thmanyah-muted hover:border-thmanyah-green hover:text-thmanyah-green transition-colors"
              >
                <PlusCircle size={16} />
                إضافة مرشح
                <ChevronDown size={14} />
              </button>

              {showPicker && availableCandidates.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-72 glass-card rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto animate-fadeInDown">
                  {availableCandidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addCandidate(c.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-thmanyah-cream transition-colors text-right"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[12px] shrink-0"
                        style={{ backgroundColor: getScoreColor(c.combinedScore) }}
                      >
                        {c.combinedScore}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-thmanyah-black truncate">
                          {c.candidateName}
                        </p>
                        <p className="text-[11px] text-thmanyah-muted truncate">
                          {c.roleContext.roleTitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedCandidates.length >= 2 && (
        <div className="space-y-4 animate-fadeInUp stagger-2">
          {/* Overall Scores */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-ui font-bold text-[15px] text-thmanyah-black mb-5">
              التقييم الإجمالي
            </h3>
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
              {selectedCandidates.map((c) => (
                <div key={c.id} className="text-center">
                  <div className="relative inline-block">
                    <ScoreRadial
                      score={c.combinedScore}
                      size={110}
                      strokeWidth={8}
                      delay={300}
                    />
                    {c.id === bestId && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-thmanyah-amber flex items-center justify-center animate-bounce-subtle">
                        <Trophy size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onViewCandidate(c.id)}
                    className="block mt-3 font-ui font-bold text-[14px] text-thmanyah-black hover:text-thmanyah-green transition-colors"
                  >
                    {c.candidateName}
                  </button>
                  <p className="text-[12px] text-thmanyah-muted">
                    {getScoreLabel(c.combinedScore)}
                  </p>
                  <span
                    className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      DECISION_CONFIG[c.decision].bgColor
                    } ${DECISION_CONFIG[c.decision].color} ${
                      DECISION_CONFIG[c.decision].borderColor
                    }`}
                  >
                    {DECISION_CONFIG[c.decision].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Comparison */}
          {dimensionNames.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-ui font-bold text-[15px] text-thmanyah-black mb-5">
                مقارنة الأبعاد
              </h3>
              <div className="space-y-5">
                {dimensionNames.map((dimName, di) => (
                  <div key={di}>
                    <p className="text-[13px] font-bold text-thmanyah-charcoal mb-2">{dimName}</p>
                    <div className="space-y-2">
                      {selectedCandidates.map((c) => {
                        const dim = c.cvAnalysis?.dimensions.find((d) => d.name === dimName);
                        if (!dim) return null;
                        const pct = (dim.score / dim.maxScore) * 100;
                        const color = getScoreColor(pct);
                        const isBest =
                          selectedCandidates.every(
                            (other) =>
                              other.id === c.id ||
                              (other.cvAnalysis?.dimensions.find((d) => d.name === dimName)
                                ?.score ?? 0) <= dim.score
                          ) && selectedCandidates.length > 1;

                        return (
                          <div key={c.id} className="flex items-center gap-3">
                            <span className="text-[12px] text-thmanyah-muted w-24 truncate shrink-0">
                              {c.candidateName}
                            </span>
                            <div className="flex-1 h-3 bg-thmanyah-warm-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full animate-barGrow origin-right"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: color,
                                  animationDelay: `${0.3 + di * 0.05}s`,
                                }}
                              />
                            </div>
                            <span
                              className="text-[13px] font-bold w-12 text-left shrink-0"
                              style={{ color }}
                            >
                              {dim.score}/{dim.maxScore}
                            </span>
                            {isBest && <Trophy size={14} className="text-thmanyah-amber shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Concerns Summary */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
            {selectedCandidates.map((c) => (
              <div key={c.id} className="glass-card rounded-2xl p-5">
                <h4 className="font-ui font-bold text-[14px] text-thmanyah-black mb-3">
                  {c.candidateName}
                </h4>
                {c.cvAnalysis && (
                  <>
                    {c.cvAnalysis.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[12px] font-bold text-thmanyah-green mb-1.5">القوة:</p>
                        <ul className="space-y-1">
                          {c.cvAnalysis.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[12px] text-thmanyah-charcoal">
                              <CheckCircle2 size={12} className="text-thmanyah-green mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.cvAnalysis.concerns.length > 0 && (
                      <div>
                        <p className="text-[12px] font-bold text-thmanyah-amber mb-1.5">تحفظات:</p>
                        <ul className="space-y-1">
                          {c.cvAnalysis.concerns.slice(0, 3).map((cn, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[12px] text-thmanyah-charcoal">
                              <AlertTriangle size={12} className="text-thmanyah-amber mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{cn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCandidates.length < 2 && (
        <div className="glass-card rounded-3xl p-12 text-center animate-fadeIn">
          <Users size={36} className="mx-auto text-thmanyah-muted mb-4" />
          <h3 className="font-display font-bold text-[18px] text-thmanyah-black mb-2">
            اختر مرشحَين للمقارنة
          </h3>
          <p className="text-[14px] text-thmanyah-muted">
            استخدم الأزرار أعلاه لاختيار المرشحين
          </p>
        </div>
      )}
    </div>
  );
}
