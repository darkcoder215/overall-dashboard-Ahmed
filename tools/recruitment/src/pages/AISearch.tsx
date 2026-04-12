import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Search, Loader2, Users, Zap, Star, ArrowLeft } from "lucide-react";
import { getCandidates, getOffers } from "@/lib/recruitee";
import { aiSearch } from "@/lib/ai";
import { getScoreColor, timeAgo } from "@/lib/utils";
import type { Candidate, Offer, AISearchResult } from "@/types";

const exampleQueries = [
  "مرشحين لديهم خبرة في البودكاست والإعلام",
  "أفضل المرشحين للوظائف التقنية",
  "مرشحون جدد تقدموا هذا الشهر بتقييمات عالية",
  "مرشحين من مصادر الإحالة",
  "مرشحون مناسبون لقسم المحتوى",
];

export default function AISearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [candidatesData, offersData] = await Promise.all([
          getCandidates({ limit: 100 }),
          getOffers(),
        ]);
        setAllCandidates(candidatesData.candidates);
        setAllOffers(offersData);
      } catch (err) {
        console.error(err);
      }
      setDataLoaded(true);
    })();
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    setHasSearched(true);
    try {
      const r = await aiSearch(q, allCandidates, allOffers);
      setResults(r);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setSearching(false);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/20 to-brand-blue/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-brand-green" />
        </div>
        <h2 className="text-xl font-display font-bold mb-2">البحث الذكي بالذكاء الاصطناعي</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          ابحث عن المرشحين المناسبين باستخدام اللغة الطبيعية. اسأل عن أي معيار وسيجد الذكاء الاصطناعي أفضل المطابقات.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالعربية... مثال: مرشحين لديهم خبرة في التسويق الرقمي"
            className="pr-11 h-12 text-base"
            disabled={!dataLoaded}
          />
        </div>
        <Button type="submit" size="lg" disabled={searching || !dataLoaded || !query.trim()}>
          {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          بحث
        </Button>
      </form>

      {/* Example Queries */}
      {!hasSearched && (
        <div className="flex flex-wrap gap-2 justify-center">
          {exampleQueries.map((q) => (
            <button
              key={q}
              onClick={() => handleSearch(q)}
              disabled={!dataLoaded}
              className="px-4 py-2 rounded-full border border-border bg-card text-xs font-bold hover:border-brand-green/30 hover:bg-brand-green/5 transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {!searching && results.length > 0 && (
        <div className="space-y-3 stagger-children">
          <p className="text-sm text-muted-foreground">{results.length} نتيجة</p>
          {results.map((r, idx) => (
            <Card
              key={r.candidate.id}
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/candidate/${r.candidate.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Rank */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: getScoreColor(r.relevance) }}
                >
                  #{idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold flex-shrink-0">
                  {r.candidate.photo_thumb_url ? (
                    <img src={r.candidate.photo_thumb_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    r.candidate.name?.charAt(0) || "?"
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold group-hover:text-brand-green transition-colors truncate">
                    {r.candidate.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {r.match_reason}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">تطابق</p>
                    <p className="text-lg font-display font-black" style={{ color: getScoreColor(r.relevance) }}>
                      {r.relevance}%
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-brand-green transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {!searching && hasSearched && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">لم يتم العثور على نتائج</p>
          <p className="text-sm mt-1">جرب صياغة مختلفة للبحث</p>
        </div>
      )}

      {!dataLoaded && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-green" />
          <p className="text-sm text-muted-foreground">جارٍ تحميل بيانات المرشحين...</p>
        </div>
      )}
    </div>
  );
}
