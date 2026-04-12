import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowRight,
  Mail,
  Phone,
  Star,
  Calendar,
  FileText,
  LinkIcon,
  Sparkles,
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  Send,
} from "lucide-react";
import { getCandidate, getCandidateNotes, getOffer, addCandidateNote } from "@/lib/recruitee";
import { analyzeCandidate } from "@/lib/ai";
import { formatDate, getScoreColor } from "@/lib/utils";
import type { Candidate, CandidateNote, Offer, AIAnalysis } from "@/types";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const recommendationLabels: Record<string, { text: string; color: string; icon: any }> = {
  strong_hire: { text: "توظيف قوي", color: "#00C17A", icon: CheckCircle },
  hire: { text: "توظيف", color: "#0072F9", icon: ThumbsUp },
  maybe: { text: "ربما", color: "#FFBC0A", icon: AlertCircle },
  pass: { text: "تجاوز", color: "#F24935", icon: XCircle },
};

export default function CandidateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const c = await getCandidate(Number(id));
        setCandidate(c);

        const n = await getCandidateNotes(Number(id));
        setNotes(n);

        if (c.placements?.[0]?.offer_id) {
          const o = await getOffer(c.placements[0].offer_id);
          setOffer(o);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAnalyze = async () => {
    if (!candidate) return;
    setAnalyzing(true);
    try {
      const result = await analyzeCandidate(candidate, offer);
      setAnalysis(result);
    } catch (err) {
      toast.error("فشل في التحليل. حاول مرة أخرى.");
    }
    setAnalyzing(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setAddingNote(true);
    try {
      await addCandidateNote(Number(id), newNote);
      setNotes([{ id: Date.now(), body: newNote, author_name: "أنت", created_at: new Date().toISOString() }, ...notes]);
      setNewNote("");
      toast.success("تمت إضافة الملاحظة");
    } catch {
      toast.error("فشل في إضافة الملاحظة");
    }
    setAddingNote(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[900px]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">المرشح غير موجود</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/candidates")}>
          العودة للمرشحين
        </Button>
      </div>
    );
  }

  const rec = analysis ? recommendationLabels[analysis.recommendation] : null;

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowRight className="w-4 h-4" />
        رجوع
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-2xl flex-shrink-0">
              {candidate.photo_thumb_url ? (
                <img src={candidate.photo_thumb_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                candidate.name?.charAt(0) || "?"
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-display font-bold">{candidate.name}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {candidate.emails?.[0] && (
                  <a href={`mailto:${candidate.emails[0]}`} className="flex items-center gap-1 hover:text-brand-green">
                    <Mail className="w-4 h-4" /> {candidate.emails[0]}
                  </a>
                )}
                {candidate.phones?.[0] && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {candidate.phones[0]}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> تقدّم {formatDate(candidate.created_at)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {candidate.source && <Badge variant="info">{candidate.source}</Badge>}
                {candidate.positive_ratings > 0 && (
                  <Badge variant="success">
                    <Star className="w-3 h-3 ml-1 fill-current" />
                    {candidate.positive_ratings}/{candidate.ratings_count} تقييم
                  </Badge>
                )}
                {candidate.cv_original_url && (
                  <a href={candidate.cv_original_url} target="_blank" rel="noopener">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <FileText className="w-3 h-3 ml-1" /> السيرة الذاتية
                    </Badge>
                  </a>
                )}
                {candidate.links?.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      <LinkIcon className="w-3 h-3 ml-1" /> رابط {i + 1}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={analyzing} className="flex-shrink-0">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              تحليل ذكي
            </Button>
          </div>

          {/* Placements */}
          {candidate.placements && candidate.placements.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border/50">
              <p className="text-xs font-bold text-muted-foreground mb-2">الوظائف المتقدم لها</p>
              <div className="flex flex-wrap gap-2">
                {candidate.placements.map((p) => (
                  <Badge
                    key={p.id}
                    variant={p.disqualified ? "destructive" : "success"}
                    className="text-xs"
                  >
                    وظيفة #{p.offer_id}
                    {p.disqualified && " — مستبعد"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">التحليل الذكي</TabsTrigger>
          <TabsTrigger value="notes">الملاحظات ({notes.length})</TabsTrigger>
        </TabsList>

        {/* AI Analysis Tab */}
        <TabsContent value="analysis">
          {analysis ? (
            <div className="space-y-4 stagger-children">
              {/* Score + Recommendation */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#EFEDE2" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke={getScoreColor(analysis.score)}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${(analysis.score / 100) * 264} 264`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-display font-black">{analysis.score}</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-right">
                      {rec && (
                        <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                          <rec.icon className="w-5 h-5" style={{ color: rec.color }} />
                          <span className="font-bold text-lg" style={{ color: rec.color }}>
                            {rec.text}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed font-body">
                        {analysis.summary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-brand-green/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-brand-green">
                      <CheckCircle className="w-4 h-4" /> نقاط القوة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <p key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 flex-shrink-0" />
                        {s}
                      </p>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-brand-amber/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-brand-amber">
                      <AlertCircle className="w-4 h-4" /> ملاحظات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.concerns.map((c, i) => (
                      <p key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-2 flex-shrink-0" />
                        {c}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Skill Match */}
              {analysis.skill_match.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">تطابق المهارات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.skill_match.map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold">{s.skill}</span>
                          <Badge
                            variant={
                              s.level === "strong" ? "success" :
                              s.level === "moderate" ? "info" :
                              s.level === "weak" ? "warning" : "secondary"
                            }
                          >
                            {s.level === "strong" ? "قوي" : s.level === "moderate" ? "متوسط" : s.level === "weak" ? "ضعيف" : "غير معروف"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.evidence}</p>
                        <Progress
                          value={s.level === "strong" ? 90 : s.level === "moderate" ? 60 : s.level === "weak" ? 30 : 10}
                          indicatorColor={
                            s.level === "strong" ? "#00C17A" : s.level === "moderate" ? "#0072F9" : "#FFBC0A"
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommended Questions */}
              {analysis.recommended_questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-blue" />
                      أسئلة مقابلة مقترحة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.recommended_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="w-6 h-6 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm">{q}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="w-10 h-10 mx-auto mb-3 text-brand-green/30" />
                <p className="text-muted-foreground text-sm">
                  اضغط "تحليل ذكي" للحصول على تقييم شامل للمرشح بالذكاء الاصطناعي
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Add note */}
              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="اكتب ملاحظة..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <Button size="icon" onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                  {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {/* Notes list */}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-muted/50 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-bold">{note.author_name}</span>
                      <span>·</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{note.body}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground/60 py-6">
                    لا توجد ملاحظات بعد
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
