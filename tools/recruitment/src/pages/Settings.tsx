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
  RefreshCw,
} from "lucide-react";
import { loadConfig, saveConfig, testConnection, clearConfigCache, getOffers } from "@/lib/recruitee";
import { toast } from "sonner";
import type { RecruiteeConfig } from "@/types";

export default function Settings() {
  const [companyId, setCompanyId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [existingConfig, setExistingConfig] = useState<RecruiteeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await loadConfig();
      if (cfg) {
        setExistingConfig(cfg);
        setCompanyId(cfg.company_id);
        setApiToken(cfg.api_token);
        setCompanyName(cfg.company_name || "");
        // Test by fetching offers through the proxy
        try {
          await getOffers();
          setConnected(true);
        } catch {
          setConnected(false);
        }
      }
    })();
  }, []);

  const handleSaveAndTest = async () => {
    if (!companyId || !apiToken) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      // 1. Save config to Supabase
      await saveConfig({
        id: existingConfig?.id,
        company_id: companyId,
        api_token: apiToken,
        company_name: companyName,
      });
      clearConfigCache();
      toast.success("تم حفظ الإعدادات");

      // 2. Reload config
      const cfg = await loadConfig();
      setExistingConfig(cfg);

      // 3. Test connection by fetching offers through the proxy
      setTesting(true);
      try {
        await getOffers();
        setConnected(true);
        toast.success("تم الاتصال بـ Recruitee بنجاح!");
      } catch {
        setConnected(false);
        toast.error("تم حفظ الإعدادات لكن فشل الاتصال بـ Recruitee. تحقق من Company ID و API Token.");
      }
      setTesting(false);
    } catch (err) {
      toast.error("فشل في حفظ الإعدادات");
    }
    setSaving(false);
  };

  const handleTestOnly = async () => {
    setTesting(true);
    try {
      await getOffers();
      setConnected(true);
      toast.success("الاتصال يعمل بنجاح!");
    } catch {
      setConnected(false);
      toast.error("فشل الاتصال. تحقق من البيانات واحفظ الإعدادات أولاً.");
    }
    setTesting(false);
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
                <p className="text-xs text-muted-foreground">تحقق من إعدادات API أدناه واحفظها</p>
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
            <Button onClick={handleSaveAndTest} disabled={saving || testing || !companyId || !apiToken}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              حفظ واختبار الاتصال
            </Button>
            {existingConfig && (
              <Button variant="outline" onClick={handleTestOnly} disabled={testing}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                اختبار الاتصال
              </Button>
            )}
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
            يتم تخزين إعدادات API في قاعدة بيانات آمنة. لا يتم مشاركة بياناتك مع أي طرف ثالث.
          </p>
          <p>
            تُستخدم بيانات Recruitee فقط لعرض المرشحين والوظائف في هذه الأداة، ولتشغيل تحليلات الذكاء الاصطناعي.
          </p>
          <p>
            البيانات تُحدّث تلقائياً كل 5 دقائق لضمان عرض أحدث المعلومات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
