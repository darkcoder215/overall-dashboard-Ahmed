import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getOffers, getCandidates, loadConfig } from "@/lib/recruitee";
import { getPipelineInsights } from "@/lib/ai";
import { formatDate, timeAgo, getStageColor } from "@/lib/utils";
import type { Offer, Candidate } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (!cfg) {
        setConfigured(false);
        setLoading(false);
        return;
      }
      setConfigured(true);
      try {
        const [offersData, candidatesData] = await Promise.all([
          getOffers(),
          getCandidates({ limit: 200 }),
        ]);
        setOffers(offersData);
        setCandidates(candidatesData.candidates);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    })();
  }, []);

  const openJobs = offers.filter((o) => o.status === "published");
  const totalCandidates = candidates.length;
  const hired = candidates.filter((c) =>
    c.placements?.some((p) => !p.disqualified)
  ).length;
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const newThisWeek = candidates.filter((c) => {
    const d = new Date(c.created_at);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return d.getTime() > weekAgo;
  }).length;

  const handleGetInsights = async () => {
    setInsightsLoading(true);
    try {
      const result = await getPipelineInsights(offers, candidates);
      setInsights(result);
    } catch {
      setInsights("تعذر الحصول على التحليل. حاول مرة أخرى.");
    }
    setInsightsLoading(false);
  };

  if (configured === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-black p-4 shadow-lg">
          <img src={`${import.meta.env.BASE_URL}thamanyah.png`} alt="ثمانية" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-display font-bold">مرحبًا بك في ذكاء التوظيف</h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          لبدء استخدام الأداة، يرجى إعداد اتصال Recruitee من صفحة الإعدادات
        </p>
        <Button onClick={() => navigate("/settings")} size="lg">
          إعداد الاتصال
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/jobs")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{openJobs.length}</p>
              <p className="text-xs text-muted-foreground font-bold">وظائف مفتوحة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/candidates")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{totalCandidates}</p>
              <p className="text-xs text-muted-foreground font-bold">إجمالي المرشحين</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-amber/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-amber" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{newThisWeek}</p>
              <p className="text-xs text-muted-foreground font-bold">مرشحون جدد هذا الأسبوع</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-peach/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-brand-peach" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{hired}</p>
              <p className="text-xs text-muted-foreground font-bold">في مراحل التوظيف</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-brand-green/20 bg-gradient-to-l from-brand-green/5 to-transparent">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-green" />
            </div>
            <CardTitle className="text-base">رؤى الذكاء الاصطناعي</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetInsights}
            disabled={insightsLoading}
          >
            {insightsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحليل"}
          </Button>
        </CardHeader>
        <CardContent>
          {insights ? (
            <p className="text-sm leading-relaxed text-muted-foreground font-body">{insights}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              اضغط "تحليل" للحصول على رؤى ذكية حول عملية التوظيف الحالية
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">أحدث المرشحين</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/candidates")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCandidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/candidate/${c.id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
                  {c.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.source || "مصدر غير محدد"} · {timeAgo(c.created_at)}
                  </p>
                </div>
                {c.positive_ratings > 0 && (
                  <Badge variant="success">{c.positive_ratings} تقييم+</Badge>
                )}
              </div>
            ))}
            {recentCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground/60 text-center py-4">لا يوجد مرشحون بعد</p>
            )}
          </CardContent>
        </Card>

        {/* Open Jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">الوظائف المفتوحة</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/jobs")}>
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openJobs.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/jobs?id=${o.id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-sm flex-shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.department?.name || "عام"} · {o.candidates_count} مرشح
                  </p>
                </div>
                <Badge variant="info">{o.candidates_count}</Badge>
              </div>
            ))}
            {openJobs.length === 0 && (
              <p className="text-sm text-muted-foreground/60 text-center py-4">لا توجد وظائف مفتوحة</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
