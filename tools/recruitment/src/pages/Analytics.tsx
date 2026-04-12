import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  Target,
} from "lucide-react";
import { getOffers, getCandidates, getDepartments } from "@/lib/recruitee";
import { getStageColor } from "@/lib/utils";
import type { Offer, Candidate, Department } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#00C17A", "#0072F9", "#FFBC0A", "#FF9172", "#84DBE5", "#B2E2BA", "#F24935", "#494C6B"];

export default function Analytics() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, c, d] = await Promise.all([
          getOffers(),
          getCandidates({ limit: 500 }),
          getDepartments(),
        ]);
        setOffers(o);
        setCandidates(c.candidates);
        setDepartments(d);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  // Compute metrics
  const openJobs = offers.filter((o) => o.status === "published");
  const totalCandidates = candidates.length;
  const totalHired = offers.reduce((s, o) => s + (o.hired_candidates_count || 0), 0);

  // Source distribution
  const sourceMap: Record<string, number> = {};
  candidates.forEach((c) => {
    const src = c.source || "غير محدد";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Department distribution
  const deptMap: Record<string, number> = {};
  offers.forEach((o) => {
    const dept = o.department?.name || "عام";
    deptMap[dept] = (deptMap[dept] || 0) + o.candidates_count;
  });
  const deptData = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, candidates]) => ({ name, candidates }));

  // Jobs by status
  const statusMap: Record<string, number> = {};
  offers.forEach((o) => {
    const label =
      o.status === "published" ? "مفتوح" :
      o.status === "closed" ? "مغلق" :
      o.status === "draft" ? "مسودة" :
      o.status === "archived" ? "مؤرشف" : o.status;
    statusMap[label] = (statusMap[label] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Candidates timeline (last 6 months)
  const timelineMap: Record<string, number> = {};
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  candidates.forEach((c) => {
    const d = new Date(c.created_at);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    timelineMap[key] = (timelineMap[key] || 0) + 1;
  });
  const timelineData = Object.entries(timelineMap)
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  // Top jobs by candidates
  const topJobs = [...offers]
    .sort((a, b) => b.candidates_count - a.candidates_count)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{offers.length}</p>
              <p className="text-xs text-muted-foreground font-bold">إجمالي الوظائف</p>
            </div>
          </CardContent>
        </Card>
        <Card>
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
              <Target className="w-6 h-6 text-brand-amber" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">{totalHired}</p>
              <p className="text-xs text-muted-foreground font-bold">تم توظيفهم</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-peach/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-brand-peach" />
            </div>
            <div>
              <p className="text-2xl font-display font-black">
                {totalCandidates > 0 ? Math.round((totalHired / totalCandidates) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground font-bold">معدل التوظيف</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              المرشحون عبر الزمن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #EFEDE2", fontFamily: "'Thmanyah Sans'" }}
                />
                <Bar dataKey="count" fill="#00C17A" radius={[6, 6, 0, 0]} name="مرشحون" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-amber" />
              مصادر المرشحين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">المرشحون حسب القسم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deptData.map((d, i) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{d.name}</span>
                  <span className="text-muted-foreground">{d.candidates} مرشح</span>
                </div>
                <Progress
                  value={(d.candidates / Math.max(...deptData.map((x) => x.candidates), 1)) * 100}
                  indicatorColor={COLORS[i % COLORS.length]}
                />
              </div>
            ))}
            {deptData.length === 0 && (
              <p className="text-sm text-muted-foreground/60 text-center py-4">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Top Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">أكثر الوظائف جذبًا للمرشحين</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topJobs.map((job, i) => (
              <div key={job.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.department?.name || "عام"}</p>
                </div>
                <span className="font-display font-black text-sm">{job.candidates_count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
