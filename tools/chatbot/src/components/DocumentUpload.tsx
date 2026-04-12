import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Table2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;

type PreviewState =
  | null
  | {
      type: "pdf_preview";
      document_id: string;
      text_preview: string;
      full_text: string;
      sections: { title: string; preview: string }[];
      total_length: number;
    }
  | {
      type: "excel_preview";
      document_id: string;
      headers: string[];
      preview_rows: Record<string, string>[];
      total_rows: number;
      sheet_name: string;
      all_rows: Record<string, string>[];
    };

const DocumentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [accessTier, setAccessTier] = useState("public");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("يرجى إدخال العنوان واختيار ملف");
      return;
    }

    setIsUploading(true);
    setResult(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("access_tier", accessTier);

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "فشل الرفع");

      if (data.type === "pdf_preview" || data.type === "excel_preview") {
        setPreview(data);
        toast.success("تم تحليل الملف — راجع المعاينة أدناه");
      } else {
        setResult(data);
        toast.success(`تم معالجة المستند: ${data.chunks_count} قطعة نصية`);
        setFile(null);
        setTitle("");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPdf = async () => {
    if (!preview || preview.type !== "pdf_preview") return;
    setIsProcessing(true);

    try {
      const textBlob = new Blob([preview.full_text], { type: "text/plain" });
      const textFile = new File([textBlob], "extracted.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", textFile);
      formData.append("title", title);
      formData.append("access_tier", accessTier);

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "فشل المعالجة");

      setResult(data);
      setPreview(null);
      toast.success(`تم معالجة PDF: ${data.chunks_count} قطعة نصية`);
      setFile(null);
      setTitle("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmExcel = async () => {
    if (!preview || preview.type !== "excel_preview") return;
    if (!description.trim()) {
      toast.error("يرجى إدخال وصف لمحتوى الملف");
      return;
    }

    setIsProcessing(true);

    try {
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "process_excel",
          document_id: preview.document_id,
          description: description.trim(),
          headers: preview.headers,
          rows: preview.all_rows,
          access_tier: accessTier,
          title,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "فشل المعالجة");

      setResult({ ...data, type: "excel" });
      setPreview(null);
      toast.success(`تم معالجة ${data.rows_count} صف بنجاح`);
      setFile(null);
      setTitle("");
      setDescription("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setIsProcessing(false);
    }
  };

  const acceptedTypes = ".txt,.md,.csv,.text,.pdf,.xlsx,.xls";

  /* Helper: format numbers to ensure English digits */
  const formatNum = (n: number) => n.toLocaleString("en-US");

  return (
    <Card className="rounded-2xl border-border shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg" dir="rtl">
          <Upload className="h-5 w-5 text-brand-green" />
          رفع مستند جديد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        <Input
          placeholder="عنوان المستند"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-xl border-border bg-background font-ui text-sm focus:border-brand-green focus:ring-brand-green"
        />

        <select
          value={accessTier}
          onChange={(e) => setAccessTier(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 font-ui text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
        >
          <option value="public">عام — متاح للجميع</option>
          <option value="financial">مالي — للمسؤولين فقط</option>
          <option value="confidential">سري — للمسؤولين فقط</option>
        </select>

        {/* File drop zone — dashed border, rounded */}
        <div className="flex items-center gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background p-8 font-ui text-sm text-muted-foreground transition-all duration-200 hover:border-brand-green/40 hover:bg-brand-green/5">
            <FileText className="h-5 w-5" />
            {file ? file.name : "اختر ملفاً (.txt, .md, .csv, .pdf, .xlsx)"}
            <input
              type="file"
              accept={acceptedTypes}
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
                setResult(null);
              }}
            />
          </label>
        </div>

        {!preview && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !title.trim()}
            className="h-11 w-full rounded-full bg-black font-ui text-sm font-bold text-white transition-all duration-200 hover:bg-brand-charcoal hover:shadow-md disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحليل...
              </>
            ) : (
              "رفع وتحليل"
            )}
          </Button>
        )}

        {/* PDF Preview */}
        {preview?.type === "pdf_preview" && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-ui font-medium text-brand-green">
                <Eye className="h-4 w-4" />
                معاينة النص المستخرج ({formatNum(Math.round(preview.total_length / 1000))}k حرف)
              </div>
              {preview.sections.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 font-ui text-xs font-medium text-muted-foreground">الأقسام المكتشفة:</p>
                  <div className="flex flex-wrap gap-1">
                    {preview.sections.map((s, i) => (
                      <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 font-ui text-xs">
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <ScrollArea className="h-48 rounded-xl border border-border bg-background p-3">
                <pre className="whitespace-pre-wrap font-body text-xs text-foreground" dir="rtl">
                  {preview.text_preview}
                  {preview.total_length > 3000 && "\n\n... (تم اقتطاع المعاينة)"}
                </pre>
              </ScrollArea>
            </div>
            <Button
              onClick={handleConfirmPdf}
              disabled={isProcessing}
              className="h-11 w-full rounded-full bg-brand-green font-ui text-sm font-bold text-white transition-all duration-200 hover:bg-brand-green/90 hover:shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التقطيع والتضمين...
                </>
              ) : (
                "تأكيد ومعالجة النص"
              )}
            </Button>
          </div>
        )}

        {/* Excel Preview */}
        {preview?.type === "excel_preview" && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-ui font-medium text-brand-green">
                <Table2 className="h-4 w-4" />
                معاينة البيانات — {formatNum(preview.total_rows)} صف، {formatNum(preview.headers.length)} عمود (ورقة: {preview.sheet_name})
              </div>
              <ScrollArea className="h-56 rounded-xl border border-border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black">
                      {preview.headers.map((h, i) => (
                        <TableHead key={i} className="text-right font-ui text-xs font-bold text-white whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.preview_rows.map((row, ri) => (
                      <TableRow key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-[#F7F4EE]"}>
                        {preview.headers.map((h, ci) => (
                          <TableCell key={ci} className="text-right font-ui text-xs py-2 whitespace-nowrap">
                            {String(row[h] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {preview.total_rows > 20 && (
                <p className="mt-1 font-ui text-xs text-muted-foreground">
                  عرض أول 20 صف من {formatNum(preview.total_rows)}
                </p>
              )}
            </div>

            <Textarea
              placeholder="صف محتوى هذا الملف (مثال: معلومات الموظفين — الاسم والبريد والهاتف والمستوى الوظيفي)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-xl border-border font-ui text-sm focus:border-brand-green focus:ring-brand-green"
            />

            <Button
              onClick={handleConfirmExcel}
              disabled={isProcessing || !description.trim()}
              className="h-11 w-full rounded-full bg-brand-green font-ui text-sm font-bold text-white transition-all duration-200 hover:bg-brand-green/90 hover:shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري حفظ البيانات والتضمين...
                </>
              ) : (
                "تأكيد وحفظ البيانات"
              )}
            </Button>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4 font-ui text-sm animate-scale-in" dir="rtl">
            <div className="mb-2 flex items-center gap-2 font-medium text-brand-green">
              <CheckCircle2 className="h-4 w-4" />
              تمت المعالجة بنجاح
            </div>
            {result.chunks_count != null && (
              <p className="text-muted-foreground">عدد القطع النصية: {formatNum(result.chunks_count)}</p>
            )}
            {result.rows_count != null && (
              <p className="text-muted-foreground">عدد الصفوف المحفوظة: {formatNum(result.rows_count)}</p>
            )}
            {result.sections && (
              <div className="mt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">الأقسام المكتشفة:</p>
                <div className="flex flex-wrap gap-1">
                  {result.sections.map((s: string, i: number) => (
                    <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
