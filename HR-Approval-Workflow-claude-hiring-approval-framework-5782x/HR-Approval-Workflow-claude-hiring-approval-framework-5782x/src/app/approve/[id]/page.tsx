"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  User,
  Brain,
  Target,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import ApprovalStepper from "@/components/ui/ApprovalStepper";
import LoginScreen from "@/components/ui/LoginScreen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { getRequestById, approveStep, rejectStep } from "@/lib/store";
import { VacancyRequest } from "@/lib/types";

export default function ApprovePage() {
  return <AuthProvider><ApproveContent /></AuthProvider>;
}

function ApproveContent() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginScreen />;
  return <ApproveView />;
}

function ApproveView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [request, setRequest] = useState<VacancyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionDone, setActionDone] = useState<"approved" | "rejected" | null>(null);
  const [processing, setProcessing] = useState(false);

  const stepParam = searchParams.get("step");
  const stepIndex = stepParam ? parseInt(stepParam) : -1;

  useEffect(() => {
    const r = getRequestById(params.id as string);
    setRequest(r || null);
    setLoading(false);
  }, [params.id]);

  const handleApprove = () => {
    if (!request) return;
    setProcessing(true);
    const updated = approveStep(request.id, stepIndex, comment, internalComment);
    if (updated) {
      setRequest(updated);
      setActionDone("approved");
    }
    setProcessing(false);
  };

  const handleReject = () => {
    if (!request || !rejectionReason.trim()) return;
    setProcessing(true);
    const updated = rejectStep(request.id, stepIndex, rejectionReason, internalComment);
    if (updated) {
      setRequest(updated);
      setActionDone("rejected");
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse-soft font-ui text-thmanyah-muted">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="max-w-lg mx-auto px-4 md:px-6 py-32 text-center">
          <h2 className="font-display font-bold text-[24px] mb-2">الطلب غير موجود</h2>
          <Link href="/dashboard"><Button>العودة للوحة المتابعة</Button></Link>
        </div>
      </div>
    );
  }

  const step = request.approvalChain[stepIndex];
  const canAct = step && step.status === "pending" && request.currentApprovalStep === stepIndex;

  if (actionDone) {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="max-w-lg mx-auto px-4 md:px-6 py-24 text-center animate-fade-in-up">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${
              actionDone === "approved" ? "bg-thmanyah-green-light/30" : "bg-red-50"
            }`}
          >
            {actionDone === "approved" ? (
              <CheckCircle2 className="w-10 h-10 text-thmanyah-green" />
            ) : (
              <XCircle className="w-10 h-10 text-thmanyah-red" />
            )}
          </div>
          <h2 className="font-display font-black text-[28px] mb-2">
            {actionDone === "approved" ? "وافقت على الطلب" : "رفضت الطلب"}
          </h2>
          <p className="font-ui text-[14px] text-thmanyah-muted mb-2">
            طلب: {request.jobTitle} — {request.requesterName}
          </p>
          <p className="font-ui text-[13px] text-thmanyah-muted mb-8">
            {actionDone === "approved"
              ? "مرّرنا الطلب للمعتمد التالي في المسار."
              : "أوقفنا المسار وأشعرنا مقدم الطلب بالرفض."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/track/${request.id}`}>
              <Button variant="secondary">عرض الطلب</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary">لوحة المتابعة</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-thmanyah-off-white">
      <Header />

      {/* Header */}
      <div className="bg-thmanyah-black text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-thmanyah-green" />
            <span className="font-ui font-medium text-[13px] text-thmanyah-green">
              صفحة الاعتماد — {step?.role}
            </span>
          </div>
          <h1 className="font-display font-black text-[28px] leading-tight mb-2">
            {request.jobTitle}
          </h1>
          <p className="font-ui text-[14px] text-white/60">
            مقدم الطلب: {request.requesterName} — {request.department}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Badge
              status={request.status}
              approverName={request.approvalChain[request.currentApprovalStep]?.approverName}
              className="!bg-white/15 !text-white"
            />
            <span className="font-ui text-[12px] text-white/40">
              <Clock className="w-3 h-3 inline ml-1" />
              {new Date(request.createdAt).toLocaleDateString("ar-SA")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <Card>
              <h3 className="font-display font-bold text-[18px] mb-5 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-thmanyah-green" />
                ملخص الطلب
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <MiniInfo label="نوع الشاغر" value={request.vacancyType === "replacement" ? "بديل" : "مستحدث"} />
                <MiniInfo label="العدد" value={String(request.positionsCount)} />
                <MiniInfo label="المستوى" value={request.jobLevel} />
                <MiniInfo label="طبيعة الدور" value={
                  { full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد محدد", freelance: "مستقل", intern: "متدرب" }[request.roleNature] || ""
                } />
                <MiniInfo label="الدولة" value={request.country} />
                <MiniInfo label="الجنسية" value={request.nationality === "saudi" ? "سعودي" : request.nationality === "arab" ? "عربي" : "غير عربي"} />
                {request.preferredCountry && (
                  <MiniInfo label="دولة" value={request.preferredCountry} />
                )}
                {request.workLocation && (
                  <MiniInfo label="موقع العمل" value={request.workLocation === "remote" ? "عن بُعد" : "حضوري"} />
                )}
              </div>
            </Card>

            {/* Job Description */}
            <Card>
              <h3 className="font-display font-bold text-[16px] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-thmanyah-green" />
                الوصف الوظيفي
              </h3>
              <p className="font-body text-[14px] text-thmanyah-charcoal leading-relaxed whitespace-pre-wrap">
                {request.jobDescription}
              </p>
            </Card>

            {/* Replacement info */}
            {request.vacancyType === "replacement" && request.previousEmployeeName && (
              <Card>
                <h3 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-thmanyah-blue" />
                  الموظف السابق
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <MiniInfo label="الاسم" value={request.previousEmployeeName} />
                  <MiniInfo label="نوع المغادرة" value={request.departureType === "resignation" ? "استقالة" : "فصل"} />
                </div>
                {request.departureReason && (
                  <p className="font-body text-[13px] text-thmanyah-muted mt-3 leading-relaxed">
                    {request.departureReason}
                  </p>
                )}
              </Card>
            )}

            {/* New position */}
            {request.vacancyType === "new_position" && (
              <Card>
                <h3 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-thmanyah-blue" />
                  تفاصيل الشاغر المستحدث
                </h3>
                <MiniInfo
                  label="ضمن الهيكلة المعتمدة"
                  value={request.isInApprovedStructure ? "نعم" : "لا"}
                />
                {request.structureJustification && (
                  <div className="mt-3 p-3 bg-thmanyah-pale-yellow/20 rounded-xl">
                    <p className="font-ui text-[12px] text-amber-700 font-bold mb-1">تبرير الاستثناء:</p>
                    <p className="font-body text-[13px] text-amber-900 leading-relaxed">
                      {request.structureJustification}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* AI + Assessment */}
            <Card>
              <h3 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-thmanyah-green" />
                التقييم
              </h3>
              <div className="space-y-3">
                <ReviewBlock label="تفعيل AI في الدور" value={request.aiRoleIntegration} />
                <ReviewBlock label="إمكانية الأتمتة" value={request.aiAutomationPotential} />
                <ReviewBlock label="استبدال الدور بـ AI" value={request.aiReplacementAssessment} />
                <ReviewBlock label="المخاطر إذا لم نوظف" value={request.risksIfNotHired} />
                <ReviewBlock label="رفع معيار التوظيف" value={request.hiringBarCommitment} />
              </div>
            </Card>

            {/* Action area */}
            {canAct && (
              <Card className="border-2 border-thmanyah-green/20" padding="lg">
                <h3 className="font-display font-bold text-[20px] mb-5 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-thmanyah-green" />
                  قرارك
                </h3>

                <Textarea
                  label="تعليق (اختياري — يظهر لمقدم الطلب)"
                  placeholder="أضف تعليقًا إن أحببت..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <div className="mt-4">
                  <Textarea
                    label="ملاحظة داخلية (تظهر فقط للمعتمدين وفريق الثقافة)"
                    placeholder="ملاحظة داخلية بين المعتمدين..."
                    value={internalComment}
                    onChange={(e) => setInternalComment(e.target.value)}
                  />
                </div>

                {!showRejectForm ? (
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="accent"
                      size="lg"
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      onClick={handleApprove}
                      loading={processing}
                      className="flex-1"
                    >
                      موافقة
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      icon={<XCircle className="w-5 h-5" />}
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1"
                    >
                      رفض
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4 animate-fade-in-up">
                    <div className="bg-red-50 rounded-xl p-4 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-thmanyah-red shrink-0 mt-0.5" />
                      <p className="font-ui text-[13px] text-red-800">
                        رفض الطلب سيوقف مسار الاعتماد بالكامل وسيتم إشعار مقدم الطلب.
                      </p>
                    </div>
                    <Textarea
                      label="سبب الرفض (مطلوب)"
                      placeholder="اكتب سبب الرفض بالتفصيل..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="danger"
                        size="lg"
                        icon={<XCircle className="w-5 h-5" />}
                        onClick={handleReject}
                        loading={processing}
                        disabled={!rejectionReason.trim()}
                        className="flex-1"
                      >
                        تأكيد الرفض
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setShowRejectForm(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {!canAct && step && (
              <Card className="bg-thmanyah-cream border border-thmanyah-warm-border">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-thmanyah-muted" />
                  <div>
                    <p className="font-ui font-bold text-[14px]">
                      {step.status === "approved"
                        ? "وافق المعتمد على هذه المرحلة"
                        : step.status === "rejected"
                        ? "رفض المعتمد الطلب في هذه المرحلة"
                        : "ليس دورك بعد"}
                    </p>
                    <p className="font-ui text-[13px] text-thmanyah-muted">
                      {step.status === "pending" && request.currentApprovalStep !== stepIndex
                        ? "الطلب لم يصل لمرحلتك بعد"
                        : step.decidedAt
                        ? `القرار بتاريخ ${new Date(step.decidedAt).toLocaleDateString("ar-SA")}`
                        : ""}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-thmanyah-green" />
                مقدم الطلب
              </h3>
              <div className="space-y-2.5">
                <SmallInfo label="الاسم" value={request.requesterName} />
                <SmallInfo label="البريد" value={request.requesterEmail} />
                <SmallInfo label="الإدارة" value={request.department} />
                <SmallInfo label="الفريق" value={request.team} />
                <SmallInfo label="الميزانية" value={request.budgetOwner} />
              </div>
            </Card>

            <Card>
              <h3 className="font-display font-bold text-[16px] mb-5">مسار الاعتماد</h3>
              <ApprovalStepper
                steps={request.approvalChain}
                currentStep={request.currentApprovalStep}
                isRejected={request.status === "rejected"}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <p className="font-ui text-[11px] text-thmanyah-muted">{label}</p>
      <p className="font-ui font-medium text-[14px]">{value}</p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-ui text-[11px] text-thmanyah-muted">{label}</p>
      <p className="font-ui font-medium text-[13px] break-all">{value}</p>
    </div>
  );
}

function ReviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-thmanyah-cream/60 rounded-xl">
      <p className="font-ui font-bold text-[12px] text-thmanyah-charcoal mb-1">{label}</p>
      <p className="font-ui text-[13px] text-thmanyah-muted leading-relaxed">{value}</p>
    </div>
  );
}
