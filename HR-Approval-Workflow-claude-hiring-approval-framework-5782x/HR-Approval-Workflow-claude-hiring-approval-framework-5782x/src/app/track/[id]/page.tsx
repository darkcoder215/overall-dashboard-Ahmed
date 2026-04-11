"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  User,
  Building2,
  FileText,
  Brain,
  Target,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ApprovalStepper from "@/components/ui/ApprovalStepper";
import LoginScreen from "@/components/ui/LoginScreen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { getRequestById } from "@/lib/store";
import { VacancyRequest } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";

export default function TrackPage() {
  return <AuthProvider><TrackContent /></AuthProvider>;
}

function TrackContent() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginScreen />;
  return <TrackView />;
}

function TrackView() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<VacancyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    const r = getRequestById(id);
    setRequest(r || null);
    setLoading(false);
  }, [params.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse-soft font-ui text-thmanyah-muted">
            جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-thmanyah-off-white">
        <Header />
        <div className="max-w-lg mx-auto px-4 md:px-6 py-32 text-center">
          <div className="w-16 h-16 rounded-full bg-thmanyah-cream mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-thmanyah-muted" />
          </div>
          <h2 className="font-display font-bold text-[24px] mb-2">
            الطلب غير موجود
          </h2>
          <p className="font-ui text-[14px] text-thmanyah-muted mb-6">
            تأكد من صحة الرابط أو قم بتقديم طلب جديد
          </p>
          <Link href="/submit">
            <Button variant="primary">تقديم طلب جديد</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentApprover =
    request.status === "pending_approval" || request.status === "under_review" || request.status === "received"
      ? request.approvalChain[request.currentApprovalStep]
      : null;

  const isApproved = request.status === "approved" || request.status === "hiring_started";
  const isRejected = request.status === "rejected";

  return (
    <div className="min-h-screen bg-thmanyah-off-white">
      <Header />

      {/* Status banner */}
      <div
        className={`
          ${isApproved ? "bg-thmanyah-green" : isRejected ? "bg-thmanyah-red" : "bg-thmanyah-black"}
          text-white
        `}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Badge
                status={request.status}
                approverName={currentApprover?.approverName}
                className="!bg-white/20 !text-white mb-3"
              />
              <h1 className="font-display font-black text-[28px] md:text-[36px] leading-tight">
                {isApproved
                  ? "اعتمدنا طلبك"
                  : isRejected
                  ? "رفضنا طلبك"
                  : "طلبك قيد المعالجة"}
              </h1>
              <p className="font-ui text-[14px] text-white/70 mt-2">
                طلب #{request.id.slice(0, 8).toUpperCase()} — {request.jobTitle}
              </p>
              <p className="font-ui text-[13px] text-white/50 mt-1">
                <Clock className="w-3.5 h-3.5 inline ml-1" />
                {new Date(request.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                onClick={copyLink}
                className="!text-white/70 hover:!text-white hover:!bg-white/10"
              >
                {copied ? "نسخناه" : "نسخ الرابط"}
              </Button>
            </div>
          </div>

          {isApproved && (
            <div className="mt-6 bg-white/10 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
              <p className="font-ui text-[14px] text-white/90">
                سيتواصل معك فريق التوظيف خلال 24 ساعة عمل.
              </p>
            </div>
          )}

          {isRejected && request.rejectionReason && (
            <div className="mt-6 bg-white/10 rounded-xl p-4">
              <p className="font-ui text-[12px] text-white/60 mb-1">سبب الرفض:</p>
              <p className="font-ui text-[14px] text-white/90 leading-relaxed">
                {request.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Request Summary */}
            <Card>
              <h3 className="font-display font-bold text-[18px] mb-5 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-thmanyah-green" />
                ملخص الطلب
              </h3>
              <div className="space-y-4">
                <InfoRow label="المسمى الوظيفي" value={request.jobTitle} />
                <InfoRow label="المستوى" value={request.jobLevel} />
                <InfoRow
                  label="نوع الشاغر"
                  value={request.vacancyType === "replacement" ? "بديل" : "مستحدث"}
                />
                <InfoRow label="العدد المطلوب" value={String(request.positionsCount)} />
                <InfoRow
                  label="طبيعة الدور"
                  value={
                    { full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد محدد", freelance: "مستقل", intern: "متدرب" }[
                      request.roleNature
                    ] || request.roleNature
                  }
                />
                <InfoRow label="الدولة" value={request.country} />
                {request.preferredCountry && (
                  <InfoRow label="دولة" value={request.preferredCountry} />
                )}
                {request.workLocation && (
                  <InfoRow
                    label="موقع العمل"
                    value={request.workLocation === "remote" ? "عن بُعد" : "حضوري"}
                  />
                )}
                <InfoRow
                  label="الجنسية"
                  value={
                    request.nationality === "saudi"
                      ? "سعودي"
                      : request.nationality === "arab"
                      ? "عربي"
                      : "غير عربي"
                  }
                />
              </div>
            </Card>

            {/* Job Description */}
            <Card>
              <h3 className="font-display font-bold text-[18px] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-thmanyah-green" />
                الوصف الوظيفي
              </h3>
              <p className="font-body text-[15px] text-thmanyah-charcoal leading-relaxed whitespace-pre-wrap">
                {request.jobDescription}
              </p>
            </Card>

            {/* Replacement/New details */}
            {request.vacancyType === "replacement" && request.previousEmployeeName && (
              <Card>
                <h3 className="font-display font-bold text-[18px] mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-thmanyah-blue" />
                  بيانات الموظف السابق
                </h3>
                <div className="space-y-4">
                  <InfoRow label="الاسم" value={request.previousEmployeeName} />
                  <InfoRow
                    label="تاريخ المغادرة"
                    value={request.departureDate ? new Date(request.departureDate).toLocaleDateString("ar-SA") : "—"}
                  />
                  <InfoRow
                    label="نوع المغادرة"
                    value={request.departureType === "resignation" ? "استقالة" : "فصل"}
                  />
                  {request.departureReason && (
                    <div>
                      <p className="font-ui text-[12px] text-thmanyah-muted mb-1">
                        سبب المغادرة
                      </p>
                      <p className="font-body text-[14px] text-thmanyah-charcoal leading-relaxed">
                        {request.departureReason}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* AI Assessment */}
            <Card>
              <h3 className="font-display font-bold text-[18px] mb-5 flex items-center gap-2">
                <Brain className="w-5 h-5 text-thmanyah-green" />
                تقييم الذكاء الاصطناعي
              </h3>
              <div className="space-y-4">
                <AssessmentBlock label="تفعيل الذكاء الاصطناعي في الدور" value={request.aiRoleIntegration} />
                <AssessmentBlock label="إمكانية الأتمتة" value={request.aiAutomationPotential} />
                <AssessmentBlock label="مدى استبدال الدور بالذكاء الاصطناعي" value={request.aiReplacementAssessment} />
              </div>
            </Card>

            {/* Risks & Alternatives */}
            <Card>
              <h3 className="font-display font-bold text-[18px] mb-5 flex items-center gap-2">
                <Target className="w-5 h-5 text-thmanyah-green" />
                التقييم والمخاطر
              </h3>
              <div className="space-y-4">
                <AssessmentBlock label="المخاطر في حال عدم التوظيف" value={request.risksIfNotHired} />
                {request.triedAlternatives && request.alternativesDescription && (
                  <AssessmentBlock label="البدائل المُجربة" value={request.alternativesDescription} />
                )}
                <AssessmentBlock label="مستهدفات رفع المعيار" value={request.hiringBarCommitment} />
              </div>
            </Card>
          </div>

          {/* Sidebar: Approval progress */}
          <div className="space-y-6">
            {/* Requester Info */}
            <Card>
              <h3 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-thmanyah-green" />
                مقدم الطلب
              </h3>
              <div className="space-y-3">
                <SideInfoRow label="الاسم" value={request.requesterName} />
                <SideInfoRow label="البريد" value={request.requesterEmail} />
                <SideInfoRow label="الإدارة" value={request.department} />
                <SideInfoRow label="الفريق" value={request.team} />
                {request.project && <SideInfoRow label="المشروع" value={request.project} />}
                <SideInfoRow label="صاحب الميزانية" value={request.budgetOwner} />
              </div>
            </Card>

            {/* Approval Progress */}
            <Card>
              <h3 className="font-display font-bold text-[16px] mb-5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-thmanyah-green" />
                مسار الاعتماد
              </h3>
              <ApprovalStepper
                steps={request.approvalChain}
                currentStep={request.currentApprovalStep}
                isRejected={isRejected}
              />
            </Card>

            {/* Contact */}
            <Card className="bg-thmanyah-cream border border-thmanyah-warm-border">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-5 h-5 text-thmanyah-green" />
                <h4 className="font-ui font-bold text-[14px]">تحتاج مساعدة؟</h4>
              </div>
              <p className="font-ui text-[13px] text-thmanyah-muted leading-relaxed mb-3">
                للاستفسار حول طلبك، تواصل مع فريق استقطاب المواهب
              </p>
              <a
                href="mailto:zakiah@thmanyah.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full font-ui font-medium text-[13px] text-thmanyah-black hover:shadow-md transition-shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                تواصل مع زكية
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-thmanyah-warm-border last:border-0">
      <span className="font-ui text-[13px] text-thmanyah-muted">{label}</span>
      <span className="font-ui font-medium text-[14px] text-thmanyah-black">
        {value}
      </span>
    </div>
  );
}

function SideInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-ui text-[11px] text-thmanyah-muted">{label}</p>
      <p className="font-ui font-medium text-[13px] text-thmanyah-black mt-0.5 break-all">
        {value}
      </p>
    </div>
  );
}

function AssessmentBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-thmanyah-cream/60 rounded-xl">
      <p className="font-ui font-bold text-[13px] text-thmanyah-charcoal mb-2">
        {label}
      </p>
      <p className="font-body text-[14px] text-thmanyah-muted leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}
