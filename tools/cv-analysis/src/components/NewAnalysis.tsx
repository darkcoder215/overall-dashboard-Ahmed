"use client";

import { useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { RoleContext, CandidateAnalysis, ExperienceLevel } from "@/lib/types";
import { saveCandidate } from "@/lib/storage";
import {
  DEPARTMENTS,
  EXPERIENCE_LEVELS,
  MAX_CV_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  ACCEPTED_CV_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "@/lib/constants";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Video,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Briefcase,
  User,
  Sparkles,
} from "lucide-react";

interface NewAnalysisProps {
  onComplete: (id: string) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

const STEP_LABELS = ["سياق الدور", "رفع الملفات", "التحليل"];

export default function NewAnalysis({ onComplete, onCancel }: NewAnalysisProps) {
  const [step, setStep] = useState<Step>(1);
  const [roleContext, setRoleContext] = useState<RoleContext>({
    roleTitle: "",
    roleTitleEn: "",
    department: "",
    experienceLevel: "mid",
    requiredSkills: "",
    roleDescription: "",
    niceToHaveSkills: "",
    languageRequirements: "",
    additionalNotes: "",
  });
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");

  const cvInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const updateRole = (field: keyof RoleContext, value: string) => {
    setRoleContext((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 =
    roleContext.roleTitle.trim() &&
    roleContext.department &&
    roleContext.requiredSkills.trim() &&
    roleContext.roleDescription.trim();

  const canProceedStep2 = candidateName.trim() && (cvFile || videoFile);

  const handleFileDrop = useCallback(
    (e: React.DragEvent, type: "cv" | "video") => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (type === "cv") validateAndSetCv(file);
      else validateAndSetVideo(file);
    },
    []
  );

  const validateAndSetCv = (file: File) => {
    if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
      setError(`حجم الملف يتجاوز ${MAX_CV_SIZE_MB} ميجابايت`);
      return;
    }
    setError("");
    setCvFile(file);
  };

  const validateAndSetVideo = (file: File) => {
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`حجم الفيديو يتجاوز ${MAX_VIDEO_SIZE_MB} ميجابايت`);
      return;
    }
    setError("");
    setVideoFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setProgress(0);
    setStep(3);

    const candidateId = uuidv4();
    const candidate: CandidateAnalysis = {
      id: candidateId,
      candidateName,
      candidateEmail,
      roleContext,
      cvFileName: cvFile?.name || "",
      videoFileName: videoFile?.name || "",
      status: "analyzing",
      decision: "pending",
      cvAnalysis: null,
      videoAnalysis: null,
      combinedScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: "",
    };

    saveCandidate(candidate);

    try {
      // Analyze CV
      if (cvFile) {
        setProgressLabel("جاري تحليل السيرة الذاتية...");
        setProgress(10);
        const cvBase64 = await fileToBase64(cvFile);
        setProgress(25);

        const cvResponse = await fetch("/api/analyze-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cvBase64,
            cvMimeType: cvFile.type || "application/pdf",
            roleContext,
          }),
        });

        setProgress(55);
        const cvData = await cvResponse.json();

        if (cvData.error) {
          throw new Error(cvData.error);
        }

        candidate.cvAnalysis = cvData.analysis;
      }

      // Analyze Video
      if (videoFile) {
        setProgressLabel("جاري تحليل الفيديو...");
        setProgress(cvFile ? 60 : 10);
        const videoBase64 = await fileToBase64(videoFile);
        setProgress(cvFile ? 70 : 30);

        const videoResponse = await fetch("/api/analyze-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoBase64,
            videoMimeType: videoFile.type || "video/mp4",
            roleContext,
          }),
        });

        setProgress(90);
        const videoData = await videoResponse.json();

        if (videoData.error) {
          throw new Error(videoData.error);
        }

        candidate.videoAnalysis = videoData.analysis;
      }

      // Calculate combined score
      let combinedScore = 0;
      if (candidate.cvAnalysis && candidate.videoAnalysis) {
        combinedScore = Math.round(
          candidate.cvAnalysis.overallScore * 0.7 +
            candidate.videoAnalysis.overallVideoScore * 0.3
        );
      } else if (candidate.cvAnalysis) {
        combinedScore = candidate.cvAnalysis.overallScore;
      } else if (candidate.videoAnalysis) {
        combinedScore = candidate.videoAnalysis.overallVideoScore;
      }

      candidate.combinedScore = combinedScore;
      candidate.status = "completed";
      setProgress(100);
      setProgressLabel("اكتمل التحليل!");

      saveCandidate(candidate);

      setTimeout(() => {
        onComplete(candidateId);
      }, 800);
    } catch (err) {
      candidate.status = "failed";
      saveCandidate(candidate);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التحليل");
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8 animate-fadeIn">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-thmanyah-green text-white"
                      : isActive
                      ? "bg-thmanyah-black text-white"
                      : "bg-thmanyah-warm-border text-thmanyah-muted"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : stepNum}
                </div>
                <span
                  className={`text-[13px] font-ui font-medium hidden sm:block ${
                    isActive ? "text-thmanyah-black" : "text-thmanyah-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                    isCompleted ? "bg-thmanyah-green" : "bg-thmanyah-warm-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Role Context */}
      {step === 1 && (
        <div className="animate-fadeInUp">
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-thmanyah-green-pale flex items-center justify-center">
                <Briefcase size={22} className="text-thmanyah-green" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[20px]">سياق الدور الوظيفي</h2>
                <p className="text-[13px] text-thmanyah-muted">
                  حدد متطلبات الدور لتحليل أدق
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    المسمى الوظيفي <span className="text-thmanyah-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleContext.roleTitle}
                    onChange={(e) => updateRole("roleTitle", e.target.value)}
                    placeholder="مثال: مطور واجهات أمامية"
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    المسمى بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={roleContext.roleTitleEn}
                    onChange={(e) => updateRole("roleTitleEn", e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    الإدارة <span className="text-thmanyah-red">*</span>
                  </label>
                  <select
                    value={roleContext.department}
                    onChange={(e) => updateRole("department", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                  >
                    <option value="">اختر الإدارة</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    مستوى الخبرة المطلوب
                  </label>
                  <select
                    value={roleContext.experienceLevel}
                    onChange={(e) => updateRole("experienceLevel", e.target.value as ExperienceLevel)}
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                  >
                    {EXPERIENCE_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                  المهارات المطلوبة <span className="text-thmanyah-red">*</span>
                </label>
                <textarea
                  value={roleContext.requiredSkills}
                  onChange={(e) => updateRole("requiredSkills", e.target.value)}
                  placeholder="مثال: React, TypeScript, Node.js, تصميم API"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                  الوصف الوظيفي <span className="text-thmanyah-red">*</span>
                </label>
                <textarea
                  value={roleContext.roleDescription}
                  onChange={(e) => updateRole("roleDescription", e.target.value)}
                  placeholder="اكتب وصفاً تفصيلياً للمهام والمسؤوليات..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    مهارات مرغوبة (اختيارية)
                  </label>
                  <textarea
                    value={roleContext.niceToHaveSkills}
                    onChange={(e) => updateRole("niceToHaveSkills", e.target.value)}
                    placeholder="مهارات إضافية تعطي أفضلية..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    متطلبات اللغة
                  </label>
                  <input
                    type="text"
                    value={roleContext.languageRequirements}
                    onChange={(e) => updateRole("languageRequirements", e.target.value)}
                    placeholder="مثال: العربية والإنجليزية بطلاقة"
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={roleContext.additionalNotes}
                  onChange={(e) => updateRole("additionalNotes", e.target.value)}
                  placeholder="أي معلومات إضافية تساعد في التقييم..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-thmanyah-warm-border">
              <Button variant="ghost" onClick={onCancel}>
                إلغاء
              </Button>
              <Button
                variant="primary"
                icon={<ArrowLeft size={16} />}
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                التالي
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Upload Files */}
      {step === 2 && (
        <div className="animate-fadeInUp">
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <User size={22} className="text-thmanyah-blue" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[20px]">بيانات المرشح والملفات</h2>
                <p className="text-[13px] text-thmanyah-muted">
                  ارفع السيرة الذاتية و/أو الفيديو التعريفي
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Candidate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    اسم المرشح <span className="text-thmanyah-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-thmanyah-warm-border bg-white text-[14px] focus:border-thmanyah-green focus:ring-2 focus:ring-thmanyah-green/20 outline-none transition-all"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-2">
                  السيرة الذاتية
                </label>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept={ACCEPTED_CV_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndSetCv(file);
                  }}
                />
                {cvFile ? (
                  <div className="upload-zone has-file rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-thmanyah-green-pale flex items-center justify-center">
                        <FileText size={20} className="text-thmanyah-green" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-thmanyah-black">{cvFile.name}</p>
                        <p className="text-[12px] text-thmanyah-muted">
                          {(cvFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCvFile(null)}
                      className="p-2 rounded-lg hover:bg-red-50 text-thmanyah-muted hover:text-thmanyah-red transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-zone rounded-2xl p-8 text-center cursor-pointer"
                    onClick={() => cvInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("drag-over");
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove("drag-over");
                      handleFileDrop(e, "cv");
                    }}
                  >
                    <Upload size={28} className="mx-auto text-thmanyah-muted mb-3" />
                    <p className="text-[14px] font-bold text-thmanyah-charcoal mb-1">
                      اسحب الملف هنا أو اضغط للاختيار
                    </p>
                    <p className="text-[12px] text-thmanyah-muted">
                      PDF, DOC, DOCX — حتى {MAX_CV_SIZE_MB} ميجابايت
                    </p>
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-[13px] font-bold text-thmanyah-charcoal mb-2">
                  الفيديو التعريفي <span className="text-[12px] text-thmanyah-muted font-normal">(اختياري)</span>
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndSetVideo(file);
                  }}
                />
                {videoFile ? (
                  <div className="upload-zone has-file rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Video size={20} className="text-thmanyah-blue" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-thmanyah-black">{videoFile.name}</p>
                        <p className="text-[12px] text-thmanyah-muted">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setVideoFile(null)}
                      className="p-2 rounded-lg hover:bg-red-50 text-thmanyah-muted hover:text-thmanyah-red transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-zone rounded-2xl p-8 text-center cursor-pointer"
                    onClick={() => videoInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("drag-over");
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove("drag-over");
                      handleFileDrop(e, "video");
                    }}
                  >
                    <Video size={28} className="mx-auto text-thmanyah-muted mb-3" />
                    <p className="text-[14px] font-bold text-thmanyah-charcoal mb-1">
                      اسحب الفيديو هنا أو اضغط للاختيار
                    </p>
                    <p className="text-[12px] text-thmanyah-muted">
                      MP4, MOV, WebM — حتى {MAX_VIDEO_SIZE_MB} ميجابايت
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-thmanyah-red text-[13px] animate-fadeIn">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-thmanyah-warm-border">
              <Button variant="ghost" icon={<ArrowRight size={16} />} onClick={() => setStep(1)}>
                السابق
              </Button>
              <Button
                variant="accent"
                size="lg"
                icon={<Sparkles size={18} />}
                onClick={handleAnalyze}
                disabled={!canProceedStep2}
                loading={analyzing}
              >
                بدء التحليل
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Analyzing */}
      {step === 3 && (
        <div className="animate-fadeInUp">
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
            {error ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
                  <AlertCircle size={32} className="text-thmanyah-red" />
                </div>
                <h3 className="font-display font-bold text-[22px] text-thmanyah-black mb-2">
                  فشل التحليل
                </h3>
                <p className="text-[14px] text-thmanyah-muted mb-6">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="secondary" onClick={onCancel}>
                    إلغاء
                  </Button>
                  <Button
                    variant="accent"
                    onClick={() => {
                      setError("");
                      setStep(2);
                      setAnalyzing(false);
                    }}
                  >
                    حاول مرة أخرى
                  </Button>
                </div>
              </>
            ) : progress < 100 ? (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="w-20 h-20 rounded-2xl gradient-green flex items-center justify-center animate-pulse-glow">
                    <Sparkles size={36} className="text-white" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-[22px] text-thmanyah-black mb-2">
                  جاري التحليل بالذكاء الاصطناعي
                </h3>
                <p className="text-[14px] text-thmanyah-muted mb-6">{progressLabel}</p>
                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto">
                  <div className="w-full h-3 bg-thmanyah-warm-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-green transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-thmanyah-muted mt-2">{progress}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl bg-thmanyah-green-pale flex items-center justify-center mx-auto mb-6 animate-scoreReveal">
                  <CheckCircle2 size={40} className="text-thmanyah-green" />
                </div>
                <h3 className="font-display font-bold text-[22px] text-thmanyah-green mb-2">
                  اكتمل التحليل!
                </h3>
                <p className="text-[14px] text-thmanyah-muted">
                  جاري عرض النتائج...
                </p>
                <Loader2 size={20} className="mx-auto mt-4 text-thmanyah-green animate-spin" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
