import { useState, useEffect } from "react";
import { Shield, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import DocumentUpload from "./DocumentUpload";
import QueryLogs from "./QueryLogs";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  file_name: string;
  access_tier: string;
  status: string;
  created_at: string;
}

const AdminPanel = () => {
  const [documents, setDocuments] = useState<Document[]>([]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocuments((data as Document[]) || []);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const deleteDocument = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("فشل حذف المستند");
    } else {
      toast.success("تم حذف المستند");
      fetchDocuments();
    }
  };

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      public: "bg-brand-green/10 text-brand-green",
      financial: "bg-brand-amber/10 text-brand-amber",
      confidential: "bg-brand-red/10 text-brand-red",
    };
    const labels: Record<string, string> = {
      public: "عام",
      financial: "مالي",
      confidential: "سري",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 font-ui text-xs font-medium ${colors[tier] || colors.public}`}>
        {labels[tier] || tier}
      </span>
    );
  };

  return (
    <div className="space-y-6 stagger-children" dir="rtl">
      {/* Section header with green highlight */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-green" />
        <h2 className="font-display text-xl font-bold text-foreground">لوحة المسؤول</h2>
      </div>

      <DocumentUpload />

      {/* Documents List Card */}
      <Card className="rounded-2xl border-border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <FileText className="h-5 w-5 text-brand-green" />
            المستندات المرفوعة ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="py-8 text-center font-body text-sm text-muted-foreground">
              لا توجد مستندات بعد
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 sm:p-4 transition-all duration-200 hover:border-brand-green/20 hover:shadow-sm"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-wrap">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <p className="font-ui text-sm font-medium truncate">{doc.title}</p>
                      <p className="font-ui text-xs text-muted-foreground truncate">{doc.file_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {tierBadge(doc.access_tier)}
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-ui text-xs ${
                          doc.status === "processed"
                            ? "bg-brand-green/10 text-brand-green"
                            : "bg-brand-amber/10 text-brand-amber"
                        }`}
                      >
                        {doc.status === "processed" ? "مُعالج" : "قيد المعالجة"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDocument(doc.id)}
                    className="rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-brand-red/10 hover:text-brand-red shrink-0 self-end sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QueryLogs />
    </div>
  );
};

export default AdminPanel;
