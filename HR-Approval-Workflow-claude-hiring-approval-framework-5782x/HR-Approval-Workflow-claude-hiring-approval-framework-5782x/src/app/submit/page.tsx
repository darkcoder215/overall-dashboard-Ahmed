"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Briefcase,
  FileText,
  Brain,
  Target,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import RadioGroup from "@/components/ui/RadioGroup";
import Button from "@/components/ui/Button";
import FormSection from "@/components/form/FormSection";
import LoginScreen from "@/components/ui/LoginScreen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { createRequest } from "@/lib/store";
import { DUMMY_PROFILES, DummyProfile } from "@/lib/dummyProfiles";
import {
  DEPARTMENTS,
  JOB_LEVELS,
  ROLE_NATURES,
  COUNTRIES,
  INTRO_CHALLENGE,
  INTRO_OPPORTUNITY,
  HIRING_BAR_MESSAGE,
  APPROVAL_FLOW_NOTE,
  APPROVAL_CHAIN_TEMPLATE,
} from "@/lib/constants";
import { getSettings } from "@/lib/settings";

type FormData = {
  requesterName: string;
  requesterEmail: string;
  department: string;
  section: string;
  team: string;
  project: string;
  budgetOwner: string;
  vacancyType: string;
  positionsCount: string;
  previousEmployeeName: string;
  departureDate: string;
  departureType: string;
  departureReason: string;
  isInApprovedStructure: string;
  structureJustification: string;
  jobTitle: string;
  jobTitleEn: string;
  jobLevel: string;
  roleType: string;
  roleNature: string;
  jobDescription: string;
  country: string;
  preferredCountry: string;
  workLocation: string;
  nationality: string;
  triedAlternatives: string;
  alternativesDescription: string;
  whyNoAlternatives: string;
  risksIfNotHired: string;
  aiRoleIntegration: string;
  aiAutomationPotential: string;
  aiReplacementAssessment: string;
  hiringBarCommitment: string;
  expectedOutputs3Months: string;
  expectedOutputs6Months: string;
  successMetrics: string;
  managerConfirmation: string;
  directManagerName: string;
  directManagerEmail: string;
  dottedLineManagerName: string;
  dottedLineManagerEmail: string;
  deptCeoName: string;
  deptCeoEmail: string;
};

const initial: FormData = {
  requesterName: "",
  requesterEmail: "",
  department: "",
  section: "",
  team: "",
  project: "",
  budgetOwner: "",
  vacancyType: "",
  positionsCount: "1",
  previousEmployeeName: "",
  departureDate: "",
  departureType: "",
  departureReason: "",
  isInApprovedStructure: "",
  structureJustification: "",
  jobTitle: "",
  jobTitleEn: "",
  jobLevel: "",
  roleType: "",
  roleNature: "",
  jobDescription: "",
  country: "",
  preferredCountry: "",
  workLocation: "",
  nationality: "",
  triedAlternatives: "",
  alternativesDescription: "",
  whyNoAlternatives: "",
  risksIfNotHired: "",
  aiRoleIntegration: "",
  aiAutomationPotential: "",
  aiReplacementAssessment: "",
  hiringBarCommitment: "",
  expectedOutputs3Months: "",
  expectedOutputs6Months: "",
  successMetrics: "",
  managerConfirmation: "",
  directManagerName: "",
  directManagerEmail: "",
  dottedLineManagerName: "",
  dottedLineManagerEmail: "",
  deptCeoName: "",
  deptCeoEmail: "",
};

function SubmitContent() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginScreen />;
  return <SubmitForm />;
}

export default function SubmitPage() {
  return (
    <AuthProvider>
      <SubmitContent />
    </AuthProvider>
  );
}

interface AnalysisDimension {
  name: string;
  score: number;
  maxScore: number;
  detail: string;
}

interface AnalysisResult {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  dimensions?: AnalysisDimension[];
  strengths: string[];
  concerns: string[];
  aiRiskAssessment?: string;
  budgetConsideration?: string;
  recommendation: string;
  suggestedQuestions?: string[];
}

const ANALYSIS_STEPS = [
  "قراءة بيانات الطلب...",
  "تحليل الحاجة والتبرير...",
  "تقييم البدائل المتاحة...",
  "تحليل أثر الذكاء الاصطناعي...",
  "مراجعة مخرجات النجاح...",
  "بناء التقرير النهائي...",
];

function SubmitForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showPrefill, setShowPrefill] = useState(false);
  const [prefillFlash, setPrefillFlash] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Load admin-customizable settings (falls back to constants.ts defaults)
  const s = typeof window !== "undefined" ? getSettings() : null;
  const departments = s?.departments ?? DEPARTMENTS;
  const jobLevels = s?.jobLevels ?? JOB_LEVELS;
  const roleNatures = s?.roleNatures ?? ROLE_NATURES;
  const countries = s?.countries ?? COUNTRIES;
  const introChallenge = s?.introChallenge ?? INTRO_CHALLENGE;
  const introOpportunity = s?.introOpportunity ?? INTRO_OPPORTUNITY;
  const hiringBarMessage = s?.hiringBarMessage ?? HIRING_BAR_MESSAGE;
  const approvalFlowNote = s?.approvalFlowNote ?? APPROVAL_FLOW_NOTE;
  const approvalChain = s?.approvalChain ?? APPROVAL_CHAIN_TEMPLATE;

  const prefill = (profile: DummyProfile) => {
    const newForm = { ...initial };
    for (const [key, value] of Object.entries(profile.data)) {
      if (key in newForm) {
        (newForm as Record<string, string>)[key] = value;
      }
    }
    setForm(newForm);
    setErrors({});
    setShowPrefill(false);
    setPrefillFlash(true);
    setTimeout(() => setPrefillFlash(false), 1500);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setRadio = (field: keyof FormData) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.requesterName.trim()) newErrors.requesterName = "مطلوب";
    if (!form.requesterEmail.trim()) newErrors.requesterEmail = "مطلوب";
    if (!form.department) newErrors.department = "مطلوب";
    if (!form.team.trim()) newErrors.team = "مطلوب";
    if (!form.budgetOwner.trim()) newErrors.budgetOwner = "مطلوب";
    if (!form.vacancyType) newErrors.vacancyType = "مطلوب";

    if (form.vacancyType === "replacement") {
      if (!form.previousEmployeeName.trim()) newErrors.previousEmployeeName = "مطلوب";
      if (!form.departureDate) newErrors.departureDate = "مطلوب";
      if (!form.departureType) newErrors.departureType = "مطلوب";
      if (!form.departureReason.trim()) newErrors.departureReason = "مطلوب";
    }

    if (form.vacancyType === "new_position") {
      if (!form.isInApprovedStructure) newErrors.isInApprovedStructure = "مطلوب";
      if (form.isInApprovedStructure === "no" && !form.structureJustification.trim()) {
        newErrors.structureJustification = "مطلوب";
      }
    }

    if (!form.jobTitle.trim()) newErrors.jobTitle = "مطلوب";
    if (!form.jobTitleEn.trim()) newErrors.jobTitleEn = "مطلوب";
    if (!form.jobLevel) newErrors.jobLevel = "مطلوب";
    if (!form.roleType) newErrors.roleType = "مطلوب";
    if (!form.roleNature) newErrors.roleNature = "مطلوب";
    if (!form.jobDescription.trim()) newErrors.jobDescription = "مطلوب";
    if (!form.country) newErrors.country = "مطلوب";
    if (!form.workLocation) newErrors.workLocation = "مطلوب";
    if (!form.nationality) newErrors.nationality = "مطلوب";

    if (!form.triedAlternatives) newErrors.triedAlternatives = "مطلوب";
    if (form.triedAlternatives === "yes" && !form.alternativesDescription.trim()) {
      newErrors.alternativesDescription = "مطلوب";
    }
    if (form.triedAlternatives === "no" && !form.whyNoAlternatives.trim()) {
      newErrors.whyNoAlternatives = "مطلوب";
    }
    if (form.triedAlternatives !== "no" && !form.risksIfNotHired.trim()) newErrors.risksIfNotHired = "مطلوب";
    if (!form.aiRoleIntegration.trim()) newErrors.aiRoleIntegration = "مطلوب";
    if (!form.aiAutomationPotential.trim()) newErrors.aiAutomationPotential = "مطلوب";
    if (!form.aiReplacementAssessment.trim()) newErrors.aiReplacementAssessment = "مطلوب";
    if (!form.hiringBarCommitment.trim()) newErrors.hiringBarCommitment = "مطلوب";
    if (!form.expectedOutputs3Months.trim()) newErrors.expectedOutputs3Months = "مطلوب";
    if (!form.expectedOutputs6Months.trim()) newErrors.expectedOutputs6Months = "مطلوب";
    if (!form.successMetrics.trim()) newErrors.successMetrics = "مطلوب";
    if (!form.managerConfirmation) newErrors.managerConfirmation = "مطلوب";

    if (!form.directManagerName.trim()) newErrors.directManagerName = "مطلوب";
    if (!form.directManagerEmail.trim()) newErrors.directManagerEmail = "مطلوب";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = document.querySelector('[data-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(newErrors).length === 0;
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisStep(0);
    setAnalysisError(null);
    setAnalysis(null);

    // Animate through progress steps while API call runs
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2200);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: form }),
      });
      const data = await res.json();
      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      // Small delay to let final step render
      await new Promise((r) => setTimeout(r, 400));

      if (!res.ok || data.error) {
        const debugInfo = data.debug ? `\n\nOpenRouter response:\n${data.debug}` : "";
        setAnalysisError((data.error || "فشل التحليل") + debugInfo);
        setShowAnalysis(true);
      } else {
        setAnalysis(data.analysis);
        setShowAnalysis(true);
      }
    } catch {
      clearInterval(stepInterval);
      setAnalysisError("تعذر الاتصال بخدمة التحليل");
      setShowAnalysis(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    runAnalysis();
  };

  const confirmSubmit = () => {
    setShowAnalysis(false);
    setSubmitting(true);

    const request = createRequest({
      requesterName: form.requesterName,
      requesterEmail: form.requesterEmail,
      department: form.department,
      section: form.section,
      team: form.team,
      project: form.project,
      budgetOwner: form.budgetOwner,
      vacancyType: form.vacancyType as "replacement" | "new_position",
      positionsCount: parseInt(form.positionsCount) || 1,
      previousEmployeeName: form.previousEmployeeName || undefined,
      departureDate: form.departureDate || undefined,
      departureType: (form.departureType as "resignation" | "termination") || undefined,
      departureReason: form.departureReason || undefined,
      isInApprovedStructure: form.isInApprovedStructure === "yes" ? true : form.isInApprovedStructure === "no" ? false : undefined,
      structureJustification: form.structureJustification || undefined,
      jobTitle: form.jobTitle,
      jobTitleEn: form.jobTitleEn,
      jobLevel: form.jobLevel,
      roleNature: form.roleNature as "full_time" | "part_time" | "contract" | "freelance" | "intern",
      jobDescription: form.jobDescription,
      country: form.country,
      preferredCountry: form.preferredCountry || undefined,
      workLocation: form.workLocation || undefined,
      nationality: form.nationality as "saudi" | "arab" | "non_arab",
      triedAlternatives: form.triedAlternatives === "yes",
      alternativesDescription: form.alternativesDescription || undefined,
      risksIfNotHired: form.risksIfNotHired,
      aiRoleIntegration: form.aiRoleIntegration,
      aiAutomationPotential: form.aiAutomationPotential,
      aiReplacementAssessment: form.aiReplacementAssessment,
      hiringBarCommitment: form.hiringBarCommitment,
    });

    setTimeout(() => {
      router.push(`/track/${request.id}`);
    }, 800);
  };

  const cancelSubmit = () => {
    setShowAnalysis(false);
    setAnalysis(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`min-h-screen bg-thmanyah-off-white ${prefillFlash ? "animate-glow-pulse" : ""}`}>
      <Header />

      {/* Test Prefill FAB */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          {showPrefill && (
            <div className="absolute bottom-14 left-0 bg-white rounded-2xl shadow-lg border border-thmanyah-warm-border p-4 w-[280px] md:w-[320px] animate-scale-in">
              <p className="font-ui font-black text-[13px] mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-thmanyah-green" />
                تعبئة تجريبية
              </p>
              <div className="space-y-2">
                {DUMMY_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => prefill(profile)}
                    className={`w-full text-right px-4 py-3 rounded-xl border transition-all hover-lift cursor-pointer ${profile.color}`}
                  >
                    <p className="font-ui font-black text-[13px]">{profile.label}</p>
                    <p className="font-ui font-bold text-[11px] opacity-70 mt-0.5">{profile.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowPrefill(!showPrefill)}
            className="w-12 h-12 md:w-14 md:h-14 bg-thmanyah-charcoal hover:bg-thmanyah-black text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            title="تعبئة تجريبية"
          >
            <Wand2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Hero intro */}
      <div className="bg-thmanyah-black text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-thmanyah-green/10 border border-thmanyah-green/30 rounded-full mb-6">
            <Briefcase className="w-4 h-4 text-thmanyah-green" />
            <span className="font-ui text-[13px] text-thmanyah-green font-medium">
              نموذج طلب فتح شاغر وظيفي
            </span>
          </div>
          <h1 className="font-display font-black text-[26px] md:text-[40px] leading-tight mb-4">
            كل قرار توظيف، إما استثمار بعائد أو دين بفوائد
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mt-8">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-right">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-thmanyah-amber" />
                <span className="font-ui font-bold text-[13px] text-thmanyah-amber">
                  التحدي
                </span>
              </div>
              <p className="font-ui text-[13px] text-white/60 leading-relaxed">
                {introChallenge}
              </p>
            </div>
            <div className="flex-1 bg-thmanyah-green/10 border border-thmanyah-green/20 rounded-2xl p-5 text-right">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-thmanyah-green" />
                <span className="font-ui font-bold text-[13px] text-thmanyah-green">
                  الفرصة
                </span>
              </div>
              <p className="font-ui text-[13px] text-white/60 leading-relaxed">
                {introOpportunity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval flow overview */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-4 mb-8 relative z-10">
        <Card className="border border-thmanyah-warm-border">
          <button
            onClick={() => setShowApprovals(!showApprovals)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-thmanyah-green-light/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-thmanyah-green" />
              </div>
              <div className="text-right">
                <h3 className="font-ui font-bold text-[14px]">مسار الاعتماد</h3>
                <p className="font-ui text-[12px] text-thmanyah-muted">
                  6 مراحل — 5–10 أيام عمل
                </p>
              </div>
            </div>
            {showApprovals ? (
              <ChevronUp className="w-5 h-5 text-thmanyah-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-thmanyah-muted" />
            )}
          </button>

          {showApprovals && (
            <div className="mt-5 pt-5 border-t border-thmanyah-warm-border stagger-children">
              <div className="bg-thmanyah-pale-yellow/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-ui text-[12px] text-amber-800 leading-relaxed">
                  {approvalFlowNote}
                </p>
              </div>
              <div className="space-y-3">
                {approvalChain.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-thmanyah-cream/60"
                  >
                    <span className="w-7 h-7 rounded-full bg-thmanyah-black text-white flex items-center justify-center font-ui font-bold text-[12px] shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-ui font-medium text-[13px]">
                        {step.role}
                      </p>
                      {step.approverName && step.role !== "الرئيس التنفيذي" && (
                        <p className="font-ui text-[12px] text-thmanyah-muted">
                          {step.approverName}
                        </p>
                      )}
                    </div>
                    <span className="font-ui text-[12px] text-thmanyah-muted bg-white px-2.5 py-1 rounded-full">
                      {step.slaHours} ساعة
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-4 md:px-6 pb-24 space-y-6"
      >
        {/* Section 1: Requester Info */}
        <FormSection
          title="بيانات مقدم الطلب"
          icon={<User className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="الاسم الكامل"
              placeholder="مثال: أحمد محمد الفهد"
              value={form.requesterName}
              onChange={set("requesterName")}
              error={errors.requesterName}
              required
              data-error={!!errors.requesterName}
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="name@thmanyah.com"
              value={form.requesterEmail}
              onChange={set("requesterEmail")}
              error={errors.requesterEmail}
              required
              data-error={!!errors.requesterEmail}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="الإدارة"
              options={departments.map((d) => ({ value: d, label: d }))}
              value={form.department}
              onChange={set("department")}
              error={errors.department}
              required
            />
            <Input
              label="القسم"
              placeholder="مثال: قسم الهندسة"
              value={form.section}
              onChange={set("section")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="الفريق"
              placeholder="مثال: فريق المنصة"
              value={form.team}
              onChange={set("team")}
              error={errors.team}
              required
              data-error={!!errors.team}
            />
            <Input
              label="المشروع"
              placeholder="مثال: مشروع إعادة تصميم المنصة"
              value={form.project}
              onChange={set("project")}
            />
          </div>
          <Input
            label="صاحب الميزانية"
            hint="الرئيس التنفيذي لكل إدارة هو صاحب الميزانية"
            placeholder="مثال: خالد العتيبي — الرئيس التنفيذي للتقنية"
            value={form.budgetOwner}
            onChange={set("budgetOwner")}
            error={errors.budgetOwner}
            required
            data-error={!!errors.budgetOwner}
          />
        </FormSection>

        {/* Section: Request Assessment */}
        <FormSection
          title="تقييم طلب التوظيف"
          icon={<FileText className="w-5 h-5" />}
        >
          <RadioGroup
            label="هل جربت حلول أخرى غير التوظيف؟"
            name="triedAlternatives"
            options={[
              { value: "yes", label: "نعم" },
              { value: "no", label: "لا" },
            ]}
            value={form.triedAlternatives}
            onChange={setRadio("triedAlternatives")}
            required
            error={errors.triedAlternatives}
          />

          {form.triedAlternatives === "yes" && (
            <div className="animate-fade-in-up">
              <Textarea
                label="ما الحلول الأخرى التي جربتها قبل طلب التوظيف؟"
                placeholder="اذكر البدائل التي جربتها ونتائجها..."
                value={form.alternativesDescription}
                onChange={set("alternativesDescription")}
                error={errors.alternativesDescription}
                required
              />
            </div>
          )}

          {form.triedAlternatives === "no" && (
            <div className="animate-fade-in-up">
              <Textarea
                label="لماذا لم تجرب حلول أخرى حتى الآن؟"
                placeholder="اشرح لماذا لم تُجرَّب بدائل أخرى قبل طلب التوظيف..."
                value={form.whyNoAlternatives}
                onChange={set("whyNoAlternatives")}
                error={errors.whyNoAlternatives}
                required
              />
            </div>
          )}

          {form.triedAlternatives !== "no" && (
            <Textarea
              label="المخاطر والآثار السلبية في حال لم نوظف"
              hint="بالتفصيل، شاركنا الأثر على الفريق والمشاريع والأهداف"
              placeholder="اشرح بالتفصيل ماذا يحدث لو لم نوظف في هذا الشاغر..."
              value={form.risksIfNotHired}
              onChange={set("risksIfNotHired")}
              error={errors.risksIfNotHired}
              required
            />
          )}
        </FormSection>

        {/* Section 2: Vacancy Type */}
        <FormSection
          title="تفاصيل الشاغر"
          icon={<Building2 className="w-5 h-5" />}
        >
          <RadioGroup
            label="نوع الشاغر"
            name="vacancyType"
            options={[
              { value: "replacement", label: "بديل", description: "بديل لموظف سابق غادر المنظمة" },
              { value: "new_position", label: "مستحدث", description: "شاغر جديد غير موجود سابقًا" },
            ]}
            value={form.vacancyType}
            onChange={setRadio("vacancyType")}
            required
            error={errors.vacancyType}
          />

          <Input
            label="العدد المطلوب"
            type="number"
            min="1"
            max="50"
            placeholder="1"
            value={form.positionsCount}
            onChange={set("positionsCount")}
            required
          />

          {/* Conditional: Replacement */}
          {form.vacancyType === "replacement" && (
            <div className="space-y-5 p-5 bg-thmanyah-cream/40 rounded-xl border border-thmanyah-warm-border animate-fade-in-up">
              <p className="font-ui font-bold text-[14px] text-thmanyah-charcoal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-thmanyah-blue" />
                بيانات الموظف السابق
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="اسم الموظف السابق"
                  placeholder="الاسم الكامل"
                  value={form.previousEmployeeName}
                  onChange={set("previousEmployeeName")}
                  error={errors.previousEmployeeName}
                  required
                  data-error={!!errors.previousEmployeeName}
                />
                <Input
                  label="تاريخ المغادرة"
                  type="date"
                  value={form.departureDate}
                  onChange={set("departureDate")}
                  error={errors.departureDate}
                  required
                  data-error={!!errors.departureDate}
                />
              </div>
              <RadioGroup
                label="نوع المغادرة"
                name="departureType"
                options={[
                  { value: "resignation", label: "استقالة" },
                  { value: "termination", label: "إنهاء التعاقد" },
                ]}
                value={form.departureType}
                onChange={setRadio("departureType")}
                required
                error={errors.departureType}
              />
              <Textarea
                label="سبب المغادرة بالتفصيل"
                placeholder="اشرح سبب مغادرة الموظف السابق بالتفصيل..."
                value={form.departureReason}
                onChange={set("departureReason")}
                error={errors.departureReason}
                required
              />
            </div>
          )}

          {/* Conditional: New position */}
          {form.vacancyType === "new_position" && (
            <div className="space-y-5 p-5 bg-thmanyah-cream/40 rounded-xl border border-thmanyah-warm-border animate-fade-in-up">
              <RadioGroup
                label="هل الدور موجود ضمن الهيكلة المعتمدة؟"
                name="isInApprovedStructure"
                options={[
                  { value: "yes", label: "نعم" },
                  { value: "no", label: "لا" },
                ]}
                value={form.isInApprovedStructure}
                onChange={setRadio("isInApprovedStructure")}
                required
                error={errors.isInApprovedStructure}
              />

              {form.isInApprovedStructure === "no" && (
                <div className="animate-fade-in-up">
                  <div className="bg-thmanyah-pale-yellow/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="font-ui text-[12px] text-amber-800 leading-relaxed">
                      فتح شاغر خارج الهيكلة المُعتمدة، يتطلب مبررات إضافية واعتماد للاستثناء.
                    </p>
                  </div>
                  <Textarea
                    label="تبرير فتح شاغر خارج الهيكلة المعتمدة"
                    placeholder="اشرح بالتفصيل لماذا تحتاج لفتح هذا الشاغر خارج الهيكلة المعتمدة..."
                    value={form.structureJustification}
                    onChange={set("structureJustification")}
                    error={errors.structureJustification}
                    required
                  />
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Section 3: Role Details */}
        <FormSection
          title="تفاصيل الدور الوظيفي"
          icon={<Briefcase className="w-5 h-5" />}
        >
          <Input
            label="المسمى الوظيفي"
            placeholder="مثال: مهندس برمجيات أول"
            value={form.jobTitle}
            onChange={set("jobTitle")}
            error={errors.jobTitle}
            required
            data-error={!!errors.jobTitle}
          />
          <Input
            label="المسمى الوظيفي باللغة الانقليزية"
            placeholder="Example: Senior Software Engineer"
            value={form.jobTitleEn}
            onChange={set("jobTitleEn")}
            error={errors.jobTitleEn}
            required
            data-error={!!errors.jobTitleEn}
            dir="ltr"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="المستوى الوظيفي"
              options={jobLevels.map((l) => ({ value: l, label: l }))}
              value={form.jobLevel}
              onChange={set("jobLevel")}
              error={errors.jobLevel}
              required
            />
            <Select
              label="نوع الدور"
              options={[
                { value: "leadership", label: "قيادي" },
                { value: "individual_contributor", label: "مساهم فردي" },
              ]}
              value={form.roleType}
              onChange={set("roleType")}
              error={errors.roleType}
              required
            />
          </div>
          <Select
            label="طبيعة الدور"
            options={roleNatures}
            value={form.roleNature}
            onChange={set("roleNature")}
            error={errors.roleNature}
            required
          />
          <Textarea
            label="الوصف الوظيفي"
            hint="اكتب وصفًا تفصيليًا للمهام والمسؤوليات المتوقعة"
            placeholder="المهام الرئيسية، المسؤوليات، المتطلبات..."
            value={form.jobDescription}
            onChange={set("jobDescription")}
            error={errors.jobDescription}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RadioGroup
              label="الجنسية"
              name="nationality"
              options={[
                { value: "saudi", label: "سعودي" },
                { value: "arab", label: "عربي" },
                { value: "non_arab", label: "غير عربي" },
              ]}
              value={form.nationality}
              onChange={setRadio("nationality")}
              required
              error={errors.nationality}
            />
            <RadioGroup
              label="موقع العمل"
              name="workLocation"
              options={[
                { value: "remote", label: "عن بُعد" },
                { value: "onsite", label: "حضوري" },
              ]}
              value={form.workLocation}
              onChange={setRadio("workLocation")}
              required
              error={errors.workLocation}
            />
          </div>
          <RadioGroup
            label="الدولة"
            name="country"
            options={countries.map((c) => ({ value: c, label: c }))}
            value={form.country}
            onChange={setRadio("country")}
            error={errors.country}
            required
          />
          {form.country === "مرن جغرافيًا" && (
            <Input
              label="دولة (اختياري)"
              hint="لو في بالك دولة معينة، اكتبها هنا"
              placeholder="مثلًا: الإمارات، مصر، الأردن..."
              value={form.preferredCountry}
              onChange={set("preferredCountry")}
            />
          )}

        </FormSection>

        {/* Section 4: AI Assessment */}
        <FormSection
          title="تقييم الذكاء الاصطناعي"
          subtitle="ثمانية شركة تقنية، وتفعيل أدوات الذكاء الاصطناعي بعملنا ضمن مشروع التحول الرقمي والتقني يُعد إلزامي وليس خيار."
          icon={<Brain className="w-5 h-5" />}
          highlight
        >
          <div className="bg-thmanyah-black rounded-xl p-5 text-white">
            <p className="font-body text-[15px] leading-relaxed text-white/80">
              الهدف: تحليل الأدوار واحتياجنا الفعلي من المهام التي تقوم بها المواهب البشرية وما يمكن تفويضه لزملاءنا الرقميين (الذكاء الاصطناعي 🤖).
            </p>
          </div>
          <Textarea
            label="كيف يمكن تفعيل الذكاء الاصطناعي في هذا الدور؟"
            placeholder="شاركنا رؤيتك لكيفية استفادة هذا الدور من أدوات الذكاء الاصطناعي..."
            value={form.aiRoleIntegration}
            onChange={set("aiRoleIntegration")}
            error={errors.aiRoleIntegration}
            required
          />
          <Textarea
            label="هل توجد مهام تشغيلية يمكن أتمتتها لتوفير الوقت والتركيز على مهام أعلى قيمة؟"
            placeholder="حدد المهام التي يمكن أتمتتها وأثر ذلك على الإنتاجية..."
            value={form.aiAutomationPotential}
            onChange={set("aiAutomationPotential")}
            error={errors.aiAutomationPotential}
            required
          />
          <Textarea
            label="إلى أي مدى يمكن للذكاء الاصطناعي دعم أو استبدال هذا الدور؟ وهل العنصر البشري أساسي؟"
            placeholder="قيّم مدى إمكانية استبدال هذا الدور بالذكاء الاصطناعي أو دعمه..."
            value={form.aiReplacementAssessment}
            onChange={set("aiReplacementAssessment")}
            error={errors.aiReplacementAssessment}
            required
          />
        </FormSection>

        {/* Section 6: Hiring Bar */}
        <FormSection
          title="رفع معيار اختيار المواهب"
          icon={<Target className="w-5 h-5" />}
          highlight
        >
          <div className="bg-thmanyah-black rounded-xl p-5 text-white">
            <p className="font-body text-[15px] leading-relaxed text-white/80">
              {hiringBarMessage}
            </p>
          </div>
          <Textarea
            label="مستهدفاتك لرفع المعيار"
            placeholder="شاركنا خطتك لاختيار الأفضل هذه المرة..."
            value={form.hiringBarCommitment}
            onChange={set("hiringBarCommitment")}
            error={errors.hiringBarCommitment}
            required
          />
        </FormSection>

        {/* Section 6b: Success Definition */}
        <FormSection
          title="تعريف النجاح"
          icon={<CheckCircle2 className="w-5 h-5" />}
          highlight
        >
          <div className="bg-thmanyah-black rounded-xl p-5 text-white">
            <p className="font-body text-[15px] leading-relaxed text-white/80">
              خطة فترة التجربة الناجحة تُبنى بالتوازي مع تحليل الدور وقبل المقابلات وليس بعد مرحلة قبول العرض الوظيفي. هناك بعض المرونة في تعديلها بلا شك خلال مراحل التوظيف ولكن الأصل لا تُبنى من الأساس بعد المقابلات.
            </p>
          </div>
          <Textarea
            label="المخرجات المتوقعة خلال أول 3 أشهر"
            placeholder="ما الذي تتوقع أن يحققه الموظف الجديد خلال أول 90 يوم..."
            value={form.expectedOutputs3Months}
            onChange={set("expectedOutputs3Months")}
            error={errors.expectedOutputs3Months}
            required
          />
          <Textarea
            label="المخرجات المتوقعة خلال أول 6 أشهر"
            placeholder="ما الذي تتوقع أن يحققه الموظف الجديد خلال أول 6 أشهر..."
            value={form.expectedOutputs6Months}
            onChange={set("expectedOutputs6Months")}
            error={errors.expectedOutputs6Months}
            required
          />
          <Textarea
            label="مؤشرات قياس النجاح والأثر"
            placeholder="كيف ستقيس نجاح هذا التوظيف وأثره على الفريق والأهداف..."
            value={form.successMetrics}
            onChange={set("successMetrics")}
            error={errors.successMetrics}
            required
          />
        </FormSection>

        {/* Section 6c: Manager Confirmation */}
        <FormSection
          title="تأكيد مدير الشاغر"
          icon={<ShieldCheck className="w-5 h-5" />}
          highlight
        >
          <div className="bg-thmanyah-black rounded-xl p-5 text-white">
            <p className="font-body text-[15px] leading-relaxed text-white/80">
              أؤكد بأن هذا الطلب مبني على احتياج حقيقي والتوظيف يقع ضمن ميزانية إدارتي، كما قيّمتُ البدائل قبل طلب التوظيف وأتحمل أثر هذا القرار في حال عدم تحقيق النتائج المتوقعة.
            </p>
          </div>
          <RadioGroup
            label="هل تؤكد ما ورد أعلاه؟"
            name="managerConfirmation"
            options={[
              { value: "yes", label: "نعم، أؤكد" },
            ]}
            value={form.managerConfirmation}
            onChange={setRadio("managerConfirmation")}
            required
            error={errors.managerConfirmation}
          />
        </FormSection>

        {/* Section 7: Approval Chain Contacts */}
        <FormSection
          title="بيانات المعتمدين"
          icon={<ShieldCheck className="w-5 h-5" />}
          highlight
        >
          <div className="bg-thmanyah-black rounded-xl p-5 text-white">
            <p className="font-body text-[15px] leading-relaxed text-white/80">
              المعتمدون الآخرون (المواهب، الثقافة، المالية، الرئيس التنفيذي) محددون مسبقًا في النظام. يرجى تعبئة بيانات المدير المباشر فقط.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="اسم المدير المباشر"
              placeholder="الاسم الكامل"
              value={form.directManagerName}
              onChange={set("directManagerName")}
              error={errors.directManagerName}
              required
              data-error={!!errors.directManagerName}
            />
            <Input
              label="البريد الإلكتروني للمدير المباشر"
              type="email"
              placeholder="manager@thmanyah.com"
              value={form.directManagerEmail}
              onChange={set("directManagerEmail")}
              error={errors.directManagerEmail}
              required
              data-error={!!errors.directManagerEmail}
            />
          </div>
        </FormSection>

        {/* Submit */}
        <Card className="border-2 border-thmanyah-green/20 bg-thmanyah-green-light/5">
          <div className="text-center space-y-4">
            <div className="bg-thmanyah-green/10 rounded-xl p-4 max-w-lg mx-auto">
              <p className="font-ui text-[13px] text-emerald-800 leading-relaxed">
                سنحلّل طلبك آليًا قبل الإرسال لتقييم الحاجة الفعلية للتوظيف.
              </p>
            </div>

            {/* Progress bar during analysis */}
            {analyzing && (
              <div className="max-w-md mx-auto space-y-3 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-thmanyah-green animate-pulse" />
                  <span className="font-ui font-black text-[14px] text-thmanyah-charcoal">
                    {ANALYSIS_STEPS[analysisStep]}
                  </span>
                </div>
                <div className="w-full bg-thmanyah-cream rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-thmanyah-green rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  {ANALYSIS_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i <= analysisStep ? "bg-thmanyah-green scale-110" : "bg-thmanyah-warm-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {!analyzing && (
              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={submitting}
                icon={<Send className="w-4 h-4" />}
                className="min-w-[200px]"
              >
                {submitting ? "جاري الإرسال..." : "تحليل وإرسال الطلب"}
              </Button>
            )}
          </div>
        </Card>
      </form>

      {/* AI Analysis Report Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-thmanyah-black text-white rounded-t-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-black text-[20px] md:text-[24px]">تقرير التحليل الذكي</h2>
                  <p className="font-ui font-bold text-[12px] text-white/50">تحليل شامل لاحتمالية الحاجة الفعلية للتوظيف</p>
                </div>
              </div>

              {analysis && (
                <div className="mt-5 flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                    analysis.overallScore >= 70 ? "bg-thmanyah-green/20" :
                    analysis.overallScore >= 50 ? "bg-thmanyah-amber/20" :
                    "bg-thmanyah-red/20"
                  }`}>
                    <span className={`font-display font-black text-[32px] leading-none ${
                      analysis.overallScore >= 70 ? "text-thmanyah-green" :
                      analysis.overallScore >= 50 ? "text-thmanyah-amber" :
                      "text-thmanyah-red"
                    }`}>
                      {analysis.overallScore}
                    </span>
                    <span className="font-ui font-bold text-[10px] text-white/40 mt-0.5">من ١٠٠</span>
                  </div>
                  <div className="flex-1">
                    <span className={`inline-block px-3 py-1 rounded-full font-ui font-black text-[12px] mb-2 ${
                      analysis.overallScore >= 70 ? "bg-thmanyah-green/20 text-thmanyah-green" :
                      analysis.overallScore >= 50 ? "bg-thmanyah-amber/20 text-thmanyah-amber" :
                      "bg-thmanyah-red/20 text-thmanyah-red"
                    }`}>
                      {analysis.scoreLabel}
                    </span>
                    <p className="font-ui font-bold text-[14px] text-white/80 leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
              {analysisError && !analysis && (
                <div className="bg-thmanyah-pale-yellow/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-ui font-black text-[14px] text-amber-800 mb-1">تعذر إجراء التحليل</p>
                    <p className="font-ui font-bold text-[13px] text-amber-700 whitespace-pre-wrap break-all">{analysisError}</p>
                    <p className="font-ui text-[12px] text-amber-600 mt-2">يمكنك إعادة المحاولة أو المتابعة بإرسال الطلب بدون التحليل.</p>
                    <button
                      onClick={() => { setShowAnalysis(false); runAnalysis(); }}
                      className="mt-3 px-4 py-2 bg-amber-600 text-white font-ui font-bold text-[12px] rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}

              {analysis && (
                <>
                  {/* Dimension Breakdown */}
                  {analysis.dimensions && analysis.dimensions.length > 0 && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-charcoal" />
                        تحليل مفصل حسب المعايير
                      </h3>
                      <div className="space-y-3">
                        {analysis.dimensions.map((dim, i) => {
                          const pct = Math.round((dim.score / dim.maxScore) * 100);
                          const color = pct >= 70 ? "thmanyah-green" : pct >= 50 ? "thmanyah-amber" : "thmanyah-red";
                          return (
                            <div key={i} className="bg-thmanyah-off-white rounded-xl p-4 border border-thmanyah-warm-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-ui font-black text-[13px] text-thmanyah-charcoal">{dim.name}</span>
                                <span className={`font-display font-black text-[14px] text-${color}`}>
                                  {dim.score}/{dim.maxScore}
                                </span>
                              </div>
                              <div className="w-full bg-thmanyah-cream rounded-full h-2 mb-2.5 overflow-hidden">
                                <div
                                  className={`h-full bg-${color} rounded-full transition-all duration-500`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className="font-ui font-bold text-[12px] text-thmanyah-muted leading-relaxed">{dim.detail}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {analysis.strengths.length > 0 && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-green" />
                        نقاط القوة
                      </h3>
                      <div className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 bg-thmanyah-green-light/10 rounded-xl px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 text-thmanyah-green shrink-0 mt-0.5" />
                            <p className="font-ui font-bold text-[13px] text-emerald-800">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Concerns */}
                  {analysis.concerns.length > 0 && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-amber" />
                        ملاحظات وتحفظات
                      </h3>
                      <div className="space-y-2">
                        {analysis.concerns.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 bg-thmanyah-pale-yellow/20 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="font-ui font-bold text-[13px] text-amber-800">{c}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Risk Assessment */}
                  {analysis.aiRiskAssessment && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-blue" />
                        تقييم مخاطر الذكاء الاصطناعي
                      </h3>
                      <div className="bg-thmanyah-sky/10 rounded-xl px-4 py-3 border border-thmanyah-sky/20">
                        <p className="font-ui font-bold text-[13px] text-thmanyah-charcoal leading-relaxed">{analysis.aiRiskAssessment}</p>
                      </div>
                    </div>
                  )}

                  {/* Budget Consideration */}
                  {analysis.budgetConsideration && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-peach" />
                        الأثر المالي
                      </h3>
                      <div className="bg-thmanyah-blush/10 rounded-xl px-4 py-3 border border-thmanyah-blush/20">
                        <p className="font-ui font-bold text-[13px] text-thmanyah-charcoal leading-relaxed">{analysis.budgetConsideration}</p>
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-thmanyah-black rounded-xl p-5">
                    <h3 className="font-ui font-black text-[13px] text-white/50 mb-2">التوصية النهائية</h3>
                    <p className="font-body font-bold text-[16px] text-white leading-relaxed">{analysis.recommendation}</p>
                  </div>

                  {/* Suggested Questions */}
                  {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
                    <div>
                      <h3 className="font-ui font-black text-[14px] text-thmanyah-charcoal mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-thmanyah-muted" />
                        أسئلة مقترحة للنقاش
                      </h3>
                      <div className="space-y-2">
                        {analysis.suggestedQuestions.map((q, i) => (
                          <div key={i} className="flex items-start gap-2 bg-thmanyah-cream/60 rounded-xl px-4 py-3 border border-thmanyah-warm-border">
                            <span className="font-ui font-black text-[12px] text-thmanyah-muted mt-0.5 shrink-0">{i + 1}.</span>
                            <p className="font-ui font-bold text-[13px] text-thmanyah-charcoal">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={confirmSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-thmanyah-green hover:bg-emerald-600 text-white rounded-full font-ui font-black text-[14px] transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4" />
                  متابعة الإرسال
                </button>
                <button
                  onClick={cancelSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-thmanyah-cream hover:bg-thmanyah-warm-gray text-thmanyah-charcoal rounded-full font-ui font-black text-[14px] transition-all cursor-pointer"
                >
                  إلغاء ومناقشة مع إدارة المواهب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
