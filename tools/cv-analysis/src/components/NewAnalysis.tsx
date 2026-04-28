"use client";

import { useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { CandidateAnalysis, RoleContext } from "@/lib/types";
import { saveCandidate } from "@/lib/storage";
import {
  MAX_CV_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  ACCEPTED_CV_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "@/lib/constants";
import { renderPdfToImages } from "@/lib/pdf";
import { analyzeCV, analyzeVideo } from "@/lib/ai";
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
  MessageSquare,
  Sparkles,
  Send,
} from "lucide-react";

interface NewAnalysisProps {
  onComplete: (id: string) => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

const STEP_LABELS = ["وصف الدور", "رفع الملفات", "التحليل"];

const EXAMPLE_BRIEFS = [
  "نبحث عن منتج بودكاست بخبرة 5+ سنوات لقيادة سلسلة جديدة. مهم: كتابة سكربت قوية، خبرة بإدارة ضيوف، وحس صحفي عربي.",
  "مطور Frontend متوسط الخبرة، React/Next.js/TypeScript، يعمل ضمن فريق منصة. الأهداف: تسريع تطوير الميزات وتحسين الأداء.",
  "محرر فيديو احترافي للحلقات اليومية، Premiere + After Effects، إيقاع سريع، حس بصري قوي للمحتوى الإعلامي العربي.",
];

export default function NewAnalysis({ onComplete, onCancel }: NewAnalysisProps) {
  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState("");
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

  const canProceedStep1 = description.trim().length >= 20;
  const canProceedStep2 = candidateName.trim() && (cvFile || videoFile);

  const handleFileDrop = useCallback((e: React.DragEvent, type: "cv" | "video") => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (type === "cv") validateAndSetCv(file);
    else validateAndSetVideo(file);
  }, []);

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

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Build a minimal RoleContext from the chat description so existing
  // CandidateAnalysis fields (used by Dashboard / detail views) stay populated.
  const buildRoleContext = (): RoleContext => {
    const firstLine = description.trim().split(/\n|\.|—|-/)[0]?.trim() || "تحليل مرشح";
    const roleTitle = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
    return {
      roleTitle,
      roleTitleEn: "",
      department: "",
      experienceLevel: "mid",
      requiredSkills: "",
      roleDescription: description.trim(),
      niceToHaveSkills: "",
      languageRequirements: "",
      additionalNotes: "",
    };
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setProgress(0);
    setStep(3);

    const candidateId = uuidv4();
    const roleContext = buildRoleContext();
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
      if (cvFile) {
        const isPdf =
          cvFile.type === "application/pdf" ||
          cvFile.name.toLowerCase().endsWith(".pdf");

        let images: { base64: string; mimeType: string }[] = [];

        if (isPdf) {
          setProgressLabel("جاري تحويل صفحات السيرة الذاتية إلى صور...");
          setProgress(5);
          const rendered = await renderPdfToImages(cvFile, {
            scale: 1.7,
            maxPages: 12,
            jpegQuality: 0.85,
            onProgress: (done, total) => {
              const pct = Math.round((done / total) * 25);
              setProgress(5 + pct);
              setProgressLabel(`تحويل الصفحة ${done} من ${total}...`);
            },
          });
          if (rendered.length === 0) throw new Error("تعذّر استخراج صفحات من ملف PDF");
          images = rendered.map((p) => ({ base64: p.base64, mimeType: p.mimeType }));
        } else {
          // Non-PDF (DOC/DOCX) — pass as a single base64 attachment.
          setProgressLabel("جاري قراءة السيرة الذاتية...");
          setProgress(15);
          const base64 = await fileToBase64(cvFile);
          images = [{ base64, mimeType: cvFile.type || "application/octet-stream" }];
        }

        setProgressLabel("جاري تحليل السيرة الذاتية بالذكاء الاصطناعي...");
        setProgress(40);
        candidate.cvAnalysis = await analyzeCV(images, description);
        setProgress(videoFile ? 65 : 95);
      }

      if (videoFile) {
        setProgressLabel("جاري قراءة الفيديو...");
        setProgress(cvFile ? 70 : 15);
        const videoBase64 = await fileToBase64(videoFile);
        setProgress(cvFile ? 78 : 35);
        setProgressLabel("جاري تحليل الفيديو بالذكاء الاصطناعي...");
        candidate.videoAnalysis = await analyzeVideo(
          videoBase64,
          videoFile.type || "video/mp4",
          description
        );
        setProgress(95);
      }

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

      setTimeout(() => onComplete(candidateId), 800);
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

      {/* Step 1: Chat-style description */}
      {step === 1 && (
        <div className="animate-fadeInUp">
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-thmanyah-green-pale flex items-center justify-center">
                <MessageSquare size={22} className="text-thmanyah-green" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[20px]">عرّفنا بالدور وأهدافك</h2>
                <p className="text-[13px] text-thmanyah-muted">
                  اكتب وصفاً حراً — الذكاء الاصطناعي سيستخلص المتطلبات بنفسه
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب هنا… مثلاً: نبحث عن منتج بودكاست بخبرة 5+ سنوات. مهم كتابة سكربت قوية، حس صحفي، وقدرة على إدارة ضيوف. الهدف إطلاق سلسلة جديدة في الربع القادم."
                  rows={8}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-thmanyah-warm-border bg-white text-[15px] leading-relaxed focus:border-thmanyah-green focus:ring-4 focus:ring-thmanyah-green/15 outline-none transition-all resize-none font-body"
                />
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[12px] text-thmanyah-muted">
                  <span>{description.length} حرف</span>
                  {description.trim().length >= 20 && (
                    <CheckCircle2 size={14} className="text-thmanyah-green" />
                  )}
                </div>
              </div>

              {/* Example briefs */}
              <div>
                <p className="text-[12px] text-thmanyah-muted mb-2">أمثلة سريعة:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_BRIEFS.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(ex)}
                      className="text-[12px] px-3 py-1.5 rounded-full border border-thmanyah-warm-border bg-white hover:border-thmanyah-green hover:text-thmanyah-green transition-all"
                    >
                      {ex.slice(0, 50)}…
                    </button>
                  ))}
                </div>
              </div>

              {description.trim().length > 0 && description.trim().length < 20 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[13px]">
                  <AlertCircle size={16} />
                  أضف مزيداً من التفاصيل (20 حرفاً على الأقل) للحصول على تحليل دقيق
                </div>
              )}
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
                متابعة لرفع الملفات
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
                <Upload size={22} className="text-thmanyah-blue" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[20px]">رفع السيرة الذاتية أو الفيديو</h2>
                <p className="text-[13px] text-thmanyah-muted">
                  PDF يتم تحويله لصور وإرساله لـ Gemini 2.5 Pro عبر OpenRouter
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Description summary */}
              <div className="rounded-2xl bg-thmanyah-green-pale/40 border border-thmanyah-green/20 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Send size={14} className="text-thmanyah-green mt-0.5 shrink-0" />
                  <p className="text-[12px] font-bold text-thmanyah-charcoal">وصف الدور:</p>
                </div>
                <p className="text-[13px] text-thmanyah-charcoal leading-relaxed line-clamp-3">
                  {description}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[12px] text-thmanyah-green hover:underline mt-2"
                >
                  تعديل الوصف
                </button>
              </div>

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
                  السيرة الذاتية (PDF)
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
                  الفيديو التعريفي{" "}
                  <span className="text-[12px] text-thmanyah-muted font-normal">(اختياري)</span>
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
                <p className="text-[14px] text-thmanyah-muted">جاري عرض النتائج...</p>
                <Loader2 size={20} className="mx-auto mt-4 text-thmanyah-green animate-spin" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
