'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Video,
  FileText,
  Braces,
  Zap,
  Shield,
  Info,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/ui/PageHeader';

interface AIStatus {
  configured: boolean;
  connected: boolean;
  model: string | null;
  videoSupport?: boolean;
  structuredOutput?: boolean;
  error: string | null;
}

export default function SettingsPage() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      setAiStatus(data);
    } catch {
      setAiStatus({
        configured: false,
        connected: false,
        model: null,
        error: 'تعذّر الاتصال بالخادم',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    await fetchStatus();
    setTesting(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="الإعدادات"
        subtitle="إعداد الذكاء الاصطناعي وتكوين المنصة"
      />

      {/* AI Setup Section */}
      <div className="max-w-3xl space-y-6">
        {/* Connection Status Card */}
        <div className="brand-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-brand bg-brand-greenlight/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black font-display">
                إعداد الذكاء الاصطناعي
              </h2>
              <p className="text-xs text-brand-muted font-ui">
                حالة الاتصال بمحرك الذكاء الاصطناعي لتحليل الفيديو والنصوص
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
          ) : aiStatus ? (
            <div className="space-y-4">
              {/* Status Indicator */}
              <div
                className={`flex items-center gap-3 p-4 rounded-brand-lg border ${
                  aiStatus.connected
                    ? 'bg-brand-green/5 border-brand-green/20'
                    : aiStatus.configured
                    ? 'bg-brand-amber/5 border-brand-amber/20'
                    : 'bg-brand-red/5 border-brand-red/20'
                }`}
              >
                {aiStatus.connected ? (
                  <CheckCircle2 className="w-6 h-6 text-brand-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-brand-red flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-brand-black font-ui text-sm">
                    {aiStatus.connected
                      ? 'متصل وجاهز للعمل'
                      : aiStatus.configured
                      ? 'مُعدّ ولكن غير متصل'
                      : 'غير مُعدّ'}
                  </p>
                  <p className="text-xs text-brand-muted font-ui mt-0.5">
                    {aiStatus.connected
                      ? `النموذج: ${aiStatus.model}`
                      : aiStatus.error || 'الرجاء إضافة مفتاح API'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  اختبار الاتصال
                </motion.button>
              </div>

              {/* Capabilities */}
              <AnimatePresence>
                {aiStatus.connected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="text-sm font-bold text-brand-black mb-3 font-ui">
                      القدرات المتاحة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <CapabilityCard
                        icon={Video}
                        title="تحليل الفيديو"
                        description="تحليل محتوى الفيديو مباشرة وتقسيمه إلى مشاهد"
                        enabled={aiStatus.videoSupport || false}
                        color="green"
                      />
                      <CapabilityCard
                        icon={FileText}
                        title="تحليل النصوص"
                        description="تحليل نصوص البودكاست وتقسيمها ذكياً"
                        enabled={true}
                        color="blue"
                      />
                      <CapabilityCard
                        icon={Braces}
                        title="مخرجات منظّمة"
                        description="استخراج بيانات منظّمة من التحليل"
                        enabled={aiStatus.structuredOutput || false}
                        color="amber"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Setup Instructions (when not configured) */}
              <AnimatePresence>
                {!aiStatus.configured && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-brand-warmgray rounded-brand-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-brand-black mb-2 font-ui">
                          كيفية الإعداد
                        </h3>
                        <ol className="text-sm text-brand-charcoal space-y-2 font-ui list-decimal list-inside">
                          <li>
                            احصل على مفتاح API من مزوّد خدمة الذكاء الاصطناعي
                          </li>
                          <li>
                            أنشئ ملف{' '}
                            <code className="bg-brand-cream px-1.5 py-0.5 rounded text-xs font-mono">
                              .env.local
                            </code>{' '}
                            في جذر المشروع
                          </li>
                          <li>
                            أضف المفتاح بالصيغة:{' '}
                            <code className="bg-brand-cream px-1.5 py-0.5 rounded text-xs font-mono">
                              AI_API_KEY=your_key_here
                            </code>
                          </li>
                          <li>أعد تشغيل الخادم</li>
                        </ol>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        {/* Supported Formats */}
        <div className="brand-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-brand bg-brand-aquapale/40 flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black font-display">
                صيغ الفيديو المدعومة
              </h2>
              <p className="text-xs text-brand-muted font-ui">
                الصيغ التي يمكن تحليلها بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { format: 'MP4', mime: 'video/mp4' },
              { format: 'MPEG', mime: 'video/mpeg' },
              { format: 'MOV', mime: 'video/mov' },
              { format: 'WebM', mime: 'video/webm' },
            ].map((item) => (
              <div
                key={item.format}
                className="flex items-center gap-2 p-3 rounded-brand bg-brand-cream/50 border border-brand-warmgray/30"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-blue font-ui">
                    {item.format}
                  </span>
                </div>
                <span className="text-xs text-brand-muted font-ui">{item.mime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="brand-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-brand bg-brand-paleyellow/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-amber" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black font-display">
                نصائح للأداء الأمثل
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'ضغط الفيديو',
                desc: 'اضغط الفيديوهات لتقليل الحجم دون فقدان كبير في الجودة',
              },
              {
                title: 'قص المقاطع',
                desc: 'قم بقص الفيديو للأجزاء المهمة فقط لتسريع التحليل',
              },
              {
                title: 'دقة مناسبة',
                desc: 'دقة 720p كافية لمعظم مهام التحليل ويقلل وقت المعالجة',
              },
              {
                title: 'روابط YouTube',
                desc: 'يمكنك إدخال رابط YouTube مباشرة لتحليل الفيديو',
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex items-start gap-3 p-3 rounded-brand bg-brand-cream/30"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-brand-black font-ui">
                    {tip.title}
                  </p>
                  <p className="text-xs text-brand-muted font-ui">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="brand-card p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-brand bg-brand-lavender/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand-muted" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-black font-display mb-1">
                الخصوصية والأمان
              </h2>
              <p className="text-sm text-brand-muted font-body leading-relaxed">
                مفتاح API يُحفظ فقط على الخادم في متغيّرات البيئة ولا يتم مشاركته مع المتصفح.
                يتم إرسال المحتوى للتحليل عبر اتصال مشفّر ولا يُخزّن لدى مزوّد الخدمة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  description,
  enabled,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  color: 'green' | 'blue' | 'amber';
}) {
  const bgColors = {
    green: 'bg-brand-greenlight/30',
    blue: 'bg-brand-aquapale/30',
    amber: 'bg-brand-paleyellow/30',
  };
  const iconColors = {
    green: 'text-brand-green',
    blue: 'text-brand-blue',
    amber: 'text-brand-amber',
  };

  return (
    <div
      className={`rounded-brand-lg p-4 border transition-colors ${
        enabled
          ? `${bgColors[color]} border-transparent`
          : 'bg-brand-cream/30 border-brand-warmgray/30 opacity-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${enabled ? iconColors[color] : 'text-brand-muted'}`} />
        <span className="text-sm font-bold text-brand-black font-ui">{title}</span>
      </div>
      <p className="text-xs text-brand-muted font-ui">{description}</p>
      <div className="mt-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-ui ${
            enabled
              ? 'bg-brand-green/10 text-brand-green'
              : 'bg-brand-warmgray text-brand-muted'
          }`}
        >
          {enabled ? (
            <>
              <CheckCircle2 className="w-2.5 h-2.5" />
              مفعّل
            </>
          ) : (
            'غير متاح'
          )}
        </span>
      </div>
    </div>
  );
}
