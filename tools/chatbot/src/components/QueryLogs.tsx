import { useState, useEffect } from "react";
import { History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface QueryLog {
  id: string;
  question: string;
  answer: string;
  document_source: string | null;
  access_tier: string;
  created_at: string;
}

const QueryLogs = () => {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("query_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as QueryLog[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  /* Format date with English numerals (en-US locale) */
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (text: string, max = 120) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <Card className="rounded-2xl border-border shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-display text-lg">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-green" />
            سجل الاستعلامات ({logs.length.toLocaleString("en-US")})
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-brand-green/10 hover:text-brand-green"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-8 text-center font-body text-sm text-muted-foreground">لا توجد استعلامات بعد</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              {/* Table header: black bg, white text per brand data table guidelines */}
              <TableHeader>
                <TableRow className="bg-black hover:bg-black">
                  <TableHead className="text-right font-ui text-xs font-bold text-white">الوقت</TableHead>
                  <TableHead className="text-right font-ui text-xs font-bold text-white">السؤال</TableHead>
                  <TableHead className="text-right font-ui text-xs font-bold text-white">الإجابة</TableHead>
                  <TableHead className="text-right font-ui text-xs font-bold text-white">المصدر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow
                    key={log.id}
                    className={`transition-colors duration-150 ${
                      i % 2 === 0 ? "bg-white" : "bg-[#F7F4EE]"
                    } hover:bg-brand-green/5`}
                  >
                    <TableCell className="whitespace-nowrap font-ui text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[200px] font-ui text-sm" title={log.question}>
                      {truncate(log.question, 80)}
                    </TableCell>
                    <TableCell className="max-w-[300px] font-ui text-sm" title={log.answer}>
                      {truncate(log.answer)}
                    </TableCell>
                    <TableCell className="font-ui text-xs text-muted-foreground">
                      {log.document_source || "الكل"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryLogs;
