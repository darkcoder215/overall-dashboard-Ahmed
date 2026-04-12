import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  Filter,
  SortAsc,
} from "lucide-react";
import { getCandidates, getOffers } from "@/lib/recruitee";
import { formatDate, timeAgo } from "@/lib/utils";
import type { Candidate, Offer } from "@/types";

const PAGE_SIZE = 20;

export default function Candidates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerFilter = searchParams.get("offer");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(offerFilter || "");
  const [sortBy, setSortBy] = useState("created_at");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCandidates({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        query: search || undefined,
        offer_id: selectedOffer ? Number(selectedOffer) : undefined,
        sort: sortBy,
      });
      setCandidates(result.candidates);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, search, selectedOffer, sortBy]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getOffers();
        setOffers(data);
      } catch {}
    })();
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCandidates();
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </form>

        <select
          value={selectedOffer}
          onChange={(e) => { setSelectedOffer(e.target.value); setPage(0); }}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">جميع الوظائف</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="created_at">الأحدث</option>
          <option value="-created_at">الأقدم</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} مرشح {selectedOffer && "في هذه الوظيفة"}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-muted-foreground">
            صفحة {page + 1} من {totalPages}
          </p>
        )}
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {candidates.map((c) => (
            <Card
              key={c.id}
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/candidate/${c.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-lg flex-shrink-0">
                  {c.photo_thumb_url ? (
                    <img src={c.photo_thumb_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    c.name?.charAt(0) || "?"
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate group-hover:text-brand-green transition-colors">
                      {c.name}
                    </p>
                    {c.positive_ratings > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-brand-amber">
                        <Star className="w-3 h-3 fill-brand-amber" />
                        {c.positive_ratings}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    {c.emails?.[0] && <span>{c.emails[0]}</span>}
                    {c.source && <span>· {c.source}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                </div>

                {/* Placements count */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.placements && c.placements.length > 0 && (
                    <Badge variant="info">{c.placements.length} وظيفة</Badge>
                  )}
                  {c.placements?.some((p) => p.disqualified) && (
                    <Badge variant="destructive">مستبعد</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && candidates.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold">لا يوجد مرشحون</p>
          <p className="text-sm mt-1">جرب تعديل معايير البحث أو الفلتر</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <span className="text-sm font-bold px-3">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
