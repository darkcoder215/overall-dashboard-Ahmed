"use client";

import { useEffect, useState } from "react";
import { CandidateAnalysis, CandidateDecision } from "@/lib/types";
import { getCandidate, updateDecision, deleteCandidate } from "@/lib/storage";
import { DECISION_CONFIG, getScoreColor, getScoreLabel } from "@/lib/constants";
import ScoreRadial from "@/components/ui/ScoreRadial";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Code,
  Briefcase,
  Heart,
  FileText,
  Video,
  MessageSquareQuote,
  Mic,
  Eye,
  Shield,
  Star,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CandidateDetailProps {
  candidateId: string;
  onBack: () => void;
  onDeleted: () => void;
}

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  "code": <Code size={18} />,
  "briefcase": <Briefcase size={18} />,
  "graduation-cap": <GraduationCap size={18} />,
  "heart": <Heart size={18} />,
  "file-text": <FileText size={18} />,
};

const VIDEO_DIMENSION_LABELS = [
  { key: "communicationScore", label: "مهارات التواصل", icon: <Mic size={18} /> },
  { key: "confidenceScore", label: "الثقة بالنفس", icon: <Shield size={18} /> },
  { key: "clarityScore", label: "الوضوح والتنظيم", icon: <Eye size={18} /> },
  { key: "professionalismScore", label: "الاحترافية", icon: <Star size={18} /> },
];

export default function CandidateDetail({ candidateId, onBack, onDeleted }: CandidateDetailProps) {
  const [candidate, setCandidate] = useState<CandidateAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["summary", "dimensions", "strengths", "concerns", "questions"])
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const c = getCandidate(candidateId);
    setCandidate(c);
  }, [candidateId]);

  if (!candidate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-thmanyah-muted">لم يتم العثور على المرشح</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          العودة
        </Button>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleDecision = (decision: CandidateDecision) => {
    updateDecision(candidate.id, decision);
    setCandidate({ ...candidate, decision });
  };

  const handleDelete = () => {
    deleteCandidate(candidate.id);
    onDeleted();
  };

  const cv = candidate.cvAnalysis;
  const vid = candidate.videoAnalysis;
  const scoreColor = getScoreColor(candidate.combinedScore);
  const decision = DECISION_CONFIG[candidate.decision];
  const dateStr = new Date(candidate.createdAt).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-thmanyah-muted hover:text-thmanyah-black text-[14px] font-bold mb-6 transition-colors no-print"
      >
        <ArrowRight size={16} />
        العودة
      </button>

      {/* Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Score Radial */}
          <div className="animate-scoreReveal">
            <ScoreRadial
              score={candidate.combinedScore}
              size={130}
              label={getScoreLabel(candidate.combinedScore)}
              delay={300}
            />
          </div>

          {/* Candidate Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display font-black text-[28px] text-thmanyah-black">
                {candidate.candidateName}
              </h1>
              <span
                className={`text-[12px] font-bold px-3 py-1 rounded-lg border ${decision.bgColor} ${decision.color} ${decision.borderColor}`}
              >
                {decision.label}
              </span>
            </div>
            <p className="text-[15px] text-thmanyah-charcoal mb-1">
              {candidate.roleContext.roleTitle}
              {candidate.roleContext.roleTitleEn && (
                <span className="text-thmanyah-muted mr-2">
                  ({candidate.roleContext.roleTitleEn})
                </span>
              )}
            </p>
            <p className="text-[13px] text-thmanyah-muted mb-4">
              {candidate.roleContext.department} &middot; {dateStr}
            </p>

            {/* Material badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {candidate.cvFileName && (
                <span className="flex items-center gap-1.5 text-[12px] bg-thmanyah-green-pale text-thmanyah-green font-bold px-3 py-1 rounded-lg">
                  <FileText size={13} /> سيرة ذاتية
                </span>
              )}
              {candidate.videoFileName && (
                <span className="flex items-center gap-1.5 text-[12px] bg-blue-50 text-thmanyah-blue font-bold px-3 py-1 rounded-lg">
                  <Video size={13} /> فيديو تعريفي
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="glass-card rounded-2xl p-4 mb-6 no-print animate-fadeInUp stagger-1">
        <p className="text-[13px] font-bold text-thmanyah-charcoal mb-3">قرار التوظيف:</p>
        <div className="flex flex-wrap gap-2">
          {(
            ["strong_hire", "hire", "maybe", "no_hire"] as CandidateDecision[]
          ).map((d) => {
            const config = DECISION_CONFIG[d];
            const isActive = candidate.decision === d;
            return (
              <button
                key={d}
                onClick={() => handleDecision(d)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all duration-200 ${
                  isActive
                    ? `${config.bgColor} ${config.color} ${config.borderColor} ring-2 ring-offset-1`
                    : "bg-white border-thmanyah-warm-border text-thmanyah-muted hover:bg-thmanyah-cream"
                }`}
                style={isActive ? { "--tw-ring-color": scoreColor } as React.CSSProperties : {}}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CV Analysis */}
      {cv && (
        <div className="space-y-4 animate-fadeInUp stagger-2">
          {/* Summary */}
          <CollapsibleSection
            title="الملخص التنفيذي"
            icon={<Lightbulb size={20} className="text-thmanyah-amber" />}
            expanded={expandedSections.has("summary")}
            onToggle={() => toggleSection("summary")}
          >
            <p className="font-body text-[15px] text-thmanyah-charcoal leading-relaxed">
              {cv.summary}
            </p>
            {cv.recommendation && (
              <div className="mt-4 p-4 rounded-xl bg-thmanyah-green-pale border border-thmanyah-green-light">
                <p className="text-[13px] font-bold text-thmanyah-green mb-1">التوصية:</p>
                <p className="font-body text-[14px] text-thmanyah-charcoal">{cv.recommendation}</p>
              </div>
            )}
          </CollapsibleSection>

          {/* Dimensions Breakdown */}
          <CollapsibleSection
            title="تحليل الأبعاد"
            icon={<Code size={20} className="text-thmanyah-blue" />}
            expanded={expandedSections.has("dimensions")}
            onToggle={() => toggleSection("dimensions")}
          >
            <div className="space-y-4">
              {cv.dimensions.map((dim, i) => {
                const pct = (dim.score / dim.maxScore) * 100;
                const color = getScoreColor(pct);
                return (
                  <div key={i} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-thmanyah-muted">
                          {DIMENSION_ICONS[dim.icon] || <Code size={18} />}
                        </span>
                        <span className="text-[14px] font-bold text-thmanyah-black">{dim.name}</span>
                      </div>
                      <span className="font-display font-black text-[16px]" style={{ color }}>
                        {dim.score}
                        <span className="text-[12px] text-thmanyah-muted font-ui font-normal">
                          /{dim.maxScore}
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-thmanyah-warm-border rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full animate-barGrow origin-right"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                          animationDelay: `${0.3 + i * 0.1}s`,
                        }}
                      />
                    </div>
                    <p className="text-[13px] text-thmanyah-muted leading-relaxed">{dim.detail}</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CollapsibleSection
              title="نقاط القوة"
              icon={<CheckCircle2 size={20} className="text-thmanyah-green" />}
              expanded={expandedSections.has("strengths")}
              onToggle={() => toggleSection("strengths")}
            >
              <ul className="space-y-2">
                {cv.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-thmanyah-charcoal">
                    <CheckCircle2 size={16} className="text-thmanyah-green mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            <CollapsibleSection
              title="ملاحظات وتحفظات"
              icon={<AlertTriangle size={20} className="text-thmanyah-amber" />}
              expanded={expandedSections.has("concerns")}
              onToggle={() => toggleSection("concerns")}
            >
              <ul className="space-y-2">
                {cv.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-thmanyah-charcoal">
                    <AlertTriangle size={16} className="text-thmanyah-amber mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          </div>

          {/* Skills & Education */}
          {(cv.skillsMatch || cv.educationSummary) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cv.skillsMatch && (
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="flex items-center gap-2 font-ui font-bold text-[14px] text-thmanyah-black mb-3">
                    <Code size={16} className="text-thmanyah-blue" />
                    تطابق المهارات
                  </h4>
                  <p className="text-[13px] text-thmanyah-charcoal leading-relaxed">{cv.skillsMatch}</p>
                </div>
              )}
              {cv.educationSummary && (
                <div className="glass-card rounded-2xl p-5">
                  <h4 className="flex items-center gap-2 font-ui font-bold text-[14px] text-thmanyah-black mb-3">
                    <GraduationCap size={16} className="text-thmanyah-green" />
                    التعليم والشهادات
                  </h4>
                  <p className="text-[13px] text-thmanyah-charcoal leading-relaxed">{cv.educationSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggested Questions */}
          {cv.suggestedQuestions.length > 0 && (
            <CollapsibleSection
              title="أسئلة مقترحة للمقابلة"
              icon={<MessageSquareQuote size={20} className="text-thmanyah-sky" />}
              expanded={expandedSections.has("questions")}
              onToggle={() => toggleSection("questions")}
            >
              <ol className="space-y-2 list-decimal list-inside">
                {cv.suggestedQuestions.map((q, i) => (
                  <li key={i} className="text-[14px] text-thmanyah-charcoal leading-relaxed">
                    {q}
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          )}
        </div>
      )}

      {/* Video Analysis */}
      {vid && (
        <div className="mt-6 animate-fadeInUp stagger-4">
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Video size={22} className="text-thmanyah-blue" />
              </div>
              <div>
                <h3 className="font-display font-bold text-[20px]">تحليل الفيديو</h3>
                <p className="text-[13px] text-thmanyah-muted">
                  تقييم المقطع التعريفي للمرشح
                </p>
              </div>
            </div>

            {/* Video Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {VIDEO_DIMENSION_LABELS.map((dim, i) => {
                const score = vid[dim.key as keyof typeof vid] as number;
                return (
                  <ScoreRadial
                    key={dim.key}
                    score={score}
                    size={100}
                    strokeWidth={8}
                    label={dim.label}
                    delay={400 + i * 150}
                  />
                );
              })}
            </div>

            {/* Video Summary */}
            <p className="font-body text-[15px] text-thmanyah-charcoal leading-relaxed mb-4">
              {vid.summary}
            </p>

            {vid.communicationStyle && (
              <div className="p-3 rounded-xl bg-thmanyah-cream border border-thmanyah-warm-border mb-4">
                <p className="text-[13px]">
                  <span className="font-bold text-thmanyah-charcoal">أسلوب التواصل: </span>
                  <span className="text-thmanyah-muted">{vid.communicationStyle}</span>
                </p>
              </div>
            )}

            {/* Video Strengths & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vid.strengths.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-bold text-thmanyah-green mb-2">نقاط القوة:</h4>
                  <ul className="space-y-1.5">
                    {vid.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-thmanyah-charcoal">
                        <CheckCircle2 size={14} className="text-thmanyah-green mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {vid.concerns.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-bold text-thmanyah-amber mb-2">ملاحظات:</h4>
                  <ul className="space-y-1.5">
                    {vid.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-thmanyah-charcoal">
                        <AlertTriangle size={14} className="text-thmanyah-amber mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions Footer */}
      <div className="mt-6 flex items-center justify-between no-print animate-fadeInUp stagger-6">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 text-[13px] text-thmanyah-muted hover:text-thmanyah-red transition-colors"
        >
          <Trash2 size={16} />
          حذف التحليل
        </button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Printer size={15} />}
          onClick={() => window.print()}
        >
          طباعة
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn no-print">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full mx-4 animate-scaleIn">
            <h4 className="font-display font-bold text-[18px] text-thmanyah-black mb-2">
              حذف التحليل؟
            </h4>
            <p className="text-[14px] text-thmanyah-muted mb-6">
              سيتم حذف تحليل {candidate.candidateName} نهائياً ولا يمكن استرجاعه.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                إلغاء
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Collapsible Section ──────────────── */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-thmanyah-cream/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-ui font-bold text-[15px] text-thmanyah-black">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-thmanyah-muted" />
        ) : (
          <ChevronDown size={18} className="text-thmanyah-muted" />
        )}
      </button>
      {expanded && (
        <div className="px-5 pb-5 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
