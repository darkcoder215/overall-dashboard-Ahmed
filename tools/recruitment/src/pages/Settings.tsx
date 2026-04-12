import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Link2,
  Key,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Database,
  Shield,
} from "lucide-react";
import { loadConfig, saveConfig, testConnection, clearConfigCache } from "@/lib/recruitee";
import { toast } from "sonner";
import type { RecruiteeConfig } from "@/types";

export default function Settings() {
  const [companyId, setCompanyId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [existingConfig, setExistingConfig] = useState<RecruiteeConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (cfg) {
        setExistingConfig(cfg);
        setCompanyId(cfg.company_id);
        setApiToken(cfg.api_token);
        setCompanyName(cfg.company_name || "");
        // Test connection on load
        const ok = await testConnection(cfg.company_id, cfg.api_token);
        setConnected(ok);
      }
    })();
  }, []);

  const handleTest = async () => {
    if (!companyId || !apiToken) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setTesting(true);
    const ok = await testConnection(companyId, apiToken);
    setConnected(ok);
    if (ok) {
      toast.success("تم الاتصال بنجاح!");
    } else {
      toast.error("فشل الاتصال. تحقق من البيانات.");
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!companyId || !apiToken) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      await saveConfig({
        id: existingConfig?.id,
        company_id: companyId,
        api_token: apiToken,
        company_name: companyName,
      });
      clearConfigCache();
      toast.success("تم حفظ الإعدادات بنجاح");
      // Reload config
      const cfg = await loadConfig();
      setExistingConfig(cfg);
    } catch (err) {
      toast.error("فشل في حفظ الإعدادات");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-[700px]">
      {/* Connection Status */}
      <Card
        className={
          connected === true
            ? "border-brand-green/30 bg-brand-green/5"
            : connected === false
            ? "border-brand-red/30 bg-brand-red/5"
            : ""
        }
      >
        <CardContent className="p-5 flex items-center gap-4">
          {connected === true ? (
            <>
              <CheckCircle className="w-8 h-8 text-brand-green flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-green">متصل بـ Recruitee</p>
                <p className="text-xs text-muted-foreground">
                  {companyName && `${companyName} · `}Company ID: {companyId}
                </p>
              </div>
            </>
          ) : connected === false ? (
            <>
              <XCircle className="w-8 h-8 text-brand-red flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-red">غير متصل</p>
                <p className="text-xs text-muted-foreground">تحقق من إعدادات API أدناه</p>
              </div>
            </>
          ) : (
            <>
              <Link2 className="w-8 h-8 text-muted-foreground/40 flex-shrink-0" />
              <div>
                <p className="font-bold text-muted-foreground">لم يتم الإعداد بعد</p>
                <p className="text-xs text-muted-foreground">أدخل بيانات API للاتصال بـ Recruitee</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-green" />
            إعدادات Recruitee API
          </CardTitle>
          <CardDescription>
            أدخل بيانات الاتصال بـ Recruitee. يمكنك إنشاء API Token من
            <span className="mx-1 font-medium">Settings &gt; Apps and plugins &gt; Personal API tokens</span>
            في حسابك.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Company ID
              <Badge variant="destructive" className="mr-1 text-[10px]">مطلوب</Badge>
            </label>
            <Input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="مثال: 123456"
              dir="ltr"
              className="text-left font-mono"
            />
            <p className="text-xs text-muted-foreground">
              تجده في URL حسابك: app.recruitee.com/#/dashboard/c/<strong>COMPANY_ID</strong>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              <Key className="w-4 h-4" />
              API Token
              <Badge variant="destructive" className="mr-1 text-[10px]">مطلوب</Badge>
            </label>
            <Input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="أدخل API Token الخاص بك"
              dir="ltr"
              className="text-left font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              اسم الشركة
              <span className="text-muted-foreground font-normal text-xs">(اختياري)</span>
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="مثال: ثمانية"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleTest} disabled={testing || !companyId || !apiToken}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              اختبار الاتصال
            </Button>
            <Button onClick={handleSave} disabled={saving || !companyId || !apiToken}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-blue" />
            حول التخزين
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            يتم تخزين إعدادات API في قاعدة بيانات Supabase بشكل آمن. لا يتم مشاركة بياناتك مع أي طرف ثالث.
          </p>
          <p>
            تُستخدم بيانات Recruitee فقط لعرض المرشحين والوظائف في هذه الأداة، ولتشغيل تحليلات الذكاء الاصطناعي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
