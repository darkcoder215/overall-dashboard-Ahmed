import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Briefcase,
  Users,
  Search,
  MapPin,
  Calendar,
  Building2,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { getOffers } from "@/lib/recruitee";
import { formatDate } from "@/lib/utils";
import type { Offer } from "@/types";

const statusLabels: Record<string, string> = {
  published: "مفتوح",
  draft: "مسودة",
  closed: "مغلق",
  archived: "مؤرشف",
  internal: "داخلي",
};
const statusVariants: Record<string, "success" | "secondary" | "destructive" | "warning" | "info"> = {
  published: "success",
  draft: "secondary",
  closed: "destructive",
  archived: "secondary",
  internal: "info",
};

export default function Jobs() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await getOffers();
        setOffers(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = offers.filter((o) => {
    const matchSearch =
      !search ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.department?.name?.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      tab === "all" ||
      (tab === "open" && o.status === "published") ||
      (tab === "closed" && o.status === "closed") ||
      (tab === "draft" && o.status === "draft") ||
      (tab === "pool" && o.kind === "talent_pool");
    return matchSearch && matchTab;
  });

  // Group by department
  const departments = [...new Set(offers.map((o) => o.department?.name || "عام"))];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {offers.length} وظيفة · {offers.filter((o) => o.status === "published").length} مفتوحة
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الوظائف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">الكل ({offers.length})</TabsTrigger>
          <TabsTrigger value="open">
            مفتوح ({offers.filter((o) => o.status === "published").length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            مغلق ({offers.filter((o) => o.status === "closed").length})
          </TabsTrigger>
          <TabsTrigger value="pool">
            تجمع مواهب ({offers.filter((o) => o.kind === "talent_pool").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {filtered.map((offer) => (
              <Card
                key={offer.id}
                className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/candidates?offer=${offer.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-brand-green transition-colors">
                      {offer.title}
                    </CardTitle>
                    <Badge variant={statusVariants[offer.status] || "secondary"}>
                      {statusLabels[offer.status] || offer.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {offer.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {offer.department.name}
                      </span>
                    )}
                    {(offer.city || offer.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {offer.city || offer.location}
                      </span>
                    )}
                    {offer.employment_type && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {offer.employment_type}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(offer.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 font-bold">
                        <Users className="w-3.5 h-3.5 text-brand-blue" />
                        {offer.candidates_count} مرشح
                      </span>
                      <span className="flex items-center gap-1 font-bold text-brand-green">
                        <UserCheck className="w-3.5 h-3.5" />
                        {offer.hired_candidates_count} معيّن
                      </span>
                    </div>
                    {offer.careers_url && (
                      <a
                        href={offer.careers_url}
                        target="_blank"
                        rel="noopener"
                        className="text-brand-blue hover:underline text-xs flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        الصفحة
                      </a>
                    )}
                  </div>

                  {/* Pipeline preview */}
                  {offer.pipeline_template?.stages && (
                    <div className="flex gap-1 pt-1">
                      {offer.pipeline_template.stages.slice(0, 6).map((stage) => (
                        <div
                          key={stage.id}
                          className="h-1.5 flex-1 rounded-full opacity-60"
                          style={{ backgroundColor: stage.category === "hire" ? "#00C17A" : "#EFEDE2" }}
                          title={stage.name}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">لا توجد وظائف مطابقة</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
