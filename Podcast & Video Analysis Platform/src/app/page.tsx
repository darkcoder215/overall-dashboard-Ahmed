'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Upload,
  Search,
  FileText,
  Clock,
  Layers,
  TrendingUp,
  ArrowLeft,
  Podcast,
  Video,
  Sparkles,
  Brain,
  Scissors,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  Play,
  ChevronLeft,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Podcast as PodcastType } from '@/types';

const easeOut: [number, number, number, number] = [0, 0, 0.58, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const fadeRight = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } },
};

export default function DashboardPage() {
  const [podcasts, setPodcasts] = useState<PodcastType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/podcasts')
      .then((r) => r.json())
      .then((data) => setPodcasts(data.podcasts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const readyCount = podcasts.filter((p) => p.status === 'ready').length;
  const totalScenes = podcasts.reduce((sum, p) => sum + p.scenesCount, 0);

  return (
    <AppShell>
      {/* ═══════════════════════════ HERO SECTION ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative mb-16"
      >
        {/* Background decoration */}
        <div className="absolute -top-8 -right-6 w-72 h-72 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-10 w-56 h-56 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Greeting & Logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-brand-lg bg-brand-black flex items-center justify-center">
              <Image src="/thamanyah.png" alt="ثمانية" width={28} height={28} className="invert brightness-200" />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full font-ui">
                منصة تحليل البودكاست
              </span>
            </div>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-5xl font-black text-brand-black font-display leading-tight mb-4"
          >
            حلّل بودكاستك{' '}
            <span className="relative inline-block">
              <span className="relative z-10">بالذكاء الاصطناعي</span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                className="absolute bottom-1 right-0 h-3 bg-brand-greenlight/60 -z-0 rounded"
              />
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-brand-charcoal font-bold font-body max-w-2xl leading-relaxed mb-8"
          >
            ارفع فيديو أو نصاً وسيقوم الذكاء الاصطناعي بتحليله وتقسيمه إلى مشاهد ومواضيع —
            بحث ذكي، تفريغ تلقائي، وتقسيم احترافي في ثوانٍ.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-10">
            <Link href="/upload">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="btn-accent flex items-center gap-2.5 text-base px-8 py-3.5 shadow-brand-md"
              >
                <Upload className="w-5 h-5" />
                <span className="font-black">ابدأ الآن</span>
              </motion.button>
            </Link>
            <Link href="/search">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary flex items-center gap-2.5 text-base px-8 py-3.5"
              >
                <Search className="w-5 h-5" />
                <span className="font-black">البحث الذكي</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ LIVE STATS ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16"
      >
        {[
          {
            label: 'إجمالي البودكاستات',
            value: podcasts.length,
            icon: Podcast,
            bg: 'bg-brand-greenlight',
            iconColor: 'text-brand-green',
            highlight: 'border-brand-green/20',
          },
          {
            label: 'جاهز للتحرير',
            value: readyCount,
            icon: FileText,
            bg: 'bg-brand-aquapale',
            iconColor: 'text-brand-blue',
            highlight: 'border-brand-blue/20',
          },
          {
            label: 'إجمالي المشاهد',
            value: totalScenes,
            icon: Layers,
            bg: 'bg-brand-paleyellow',
            iconColor: 'text-brand-amber',
            highlight: 'border-brand-amber/20',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`brand-card p-6 group hover:shadow-brand-lg transition-all duration-300 border-2 ${stat.highlight}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-brand-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 12 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrendingUp className="w-5 h-5 text-brand-muted/40" />
              </motion.div>
            </div>
            <p className="text-4xl font-black text-brand-black font-display mb-1">{stat.value}</p>
            <p className="text-sm text-brand-muted font-bold font-ui">{stat.label}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* ═══════════════════════════ FEATURES GRID ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="mb-16"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <span className="text-xs font-black text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full font-ui mb-3 inline-block">
            القدرات
          </span>
          <h2 className="text-3xl font-black text-brand-black font-display mb-3">
            كل ما تحتاجه في منصة واحدة
          </h2>
          <p className="text-base text-brand-muted font-bold font-ui max-w-lg mx-auto">
            أدوات متكاملة لتحليل وتقسيم وإدارة محتوى البودكاست
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Video,
              title: 'تحليل الفيديو',
              desc: 'ارفع فيديو أو أدخل رابط YouTube وسيحلل الذكاء الاصطناعي المحتوى تلقائياً',
              color: 'green',
              bg: 'bg-brand-greenlight/30',
              iconBg: 'bg-brand-greenlight',
              iconColor: 'text-brand-green',
            },
            {
              icon: Brain,
              title: 'ذكاء اصطناعي متقدم',
              desc: 'نماذج Gemini المتطورة لفهم المحتوى العربي والتعرّف على المواضيع والسياقات',
              color: 'blue',
              bg: 'bg-brand-aquapale/30',
              iconBg: 'bg-brand-aquapale',
              iconColor: 'text-brand-blue',
            },
            {
              icon: Scissors,
              title: 'تقسيم ذكي للمشاهد',
              desc: 'تقسيم تلقائي إلى مشاهد حسب الموضوع مع إمكانية تخصيص معايير التقسيم',
              color: 'amber',
              bg: 'bg-brand-paleyellow/30',
              iconBg: 'bg-brand-paleyellow',
              iconColor: 'text-brand-amber',
            },
            {
              icon: Search,
              title: 'بحث ذكي في المحتوى',
              desc: 'ابحث في جميع البودكاستات دفعة واحدة بالكلمات المفتاحية أو الأسئلة الطبيعية',
              color: 'green',
              bg: 'bg-brand-mint/30',
              iconBg: 'bg-brand-mint',
              iconColor: 'text-brand-green',
            },
            {
              icon: MessageSquare,
              title: 'محادثة ذكية',
              desc: 'اسأل أسئلة عن المحتوى واحصل على إجابات فورية مع الإشارة إلى المصادر',
              color: 'blue',
              bg: 'bg-brand-lavender/30',
              iconBg: 'bg-brand-lavender',
              iconColor: 'text-brand-charcoal',
            },
            {
              icon: BarChart3,
              title: 'تحليلات وإحصائيات',
              desc: 'تتبّع عدد المشاهد والمواضيع والمدد الزمنية مع رؤى تفصيلية لكل حلقة',
              color: 'amber',
              bg: 'bg-brand-blush/30',
              iconBg: 'bg-brand-blush',
              iconColor: 'text-brand-red',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={`brand-card p-6 ${feature.bg} border-transparent hover:shadow-brand-lg transition-all duration-300 group`}
            >
              <motion.div
                whileHover={{ rotate: -8, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-14 h-14 rounded-brand-lg ${feature.iconBg} flex items-center justify-center mb-5`}
              >
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </motion.div>
              <h3 className="text-lg font-black text-brand-black font-display mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-brand-charcoal font-bold font-ui leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ HOW IT WORKS ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="mb-16"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full font-ui mb-3 inline-block">
            كيف تعمل
          </span>
          <h2 className="text-3xl font-black text-brand-black font-display mb-3">
            ثلاث خطوات فقط
          </h2>
          <p className="text-base text-brand-muted font-bold font-ui max-w-lg mx-auto">
            من الرفع إلى التحليل الكامل في دقائق
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: Upload,
              title: 'ارفع المحتوى',
              desc: 'ارفع ملف فيديو، أدخل رابط YouTube، أو الصق نص البودكاست مباشرة',
              color: 'bg-brand-green',
              lightBg: 'bg-brand-greenlight/20',
            },
            {
              step: '02',
              icon: Sparkles,
              title: 'التحليل الذكي',
              desc: 'الذكاء الاصطناعي يحلل المحتوى ويتعرّف على المواضيع والمشاهد تلقائياً',
              color: 'bg-brand-blue',
              lightBg: 'bg-brand-aquapale/20',
            },
            {
              step: '03',
              icon: Layers,
              title: 'راجع وحرّر',
              desc: 'راجع المشاهد المقترحة، عدّل العناوين والمحتوى، وأعد التحليل حسب الحاجة',
              color: 'bg-brand-amber',
              lightBg: 'bg-brand-paleyellow/20',
            },
          ].map((step, index) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              className="relative"
            >
              {/* Connector line */}
              {index < 2 && (
                <div className="hidden md:block absolute top-12 -left-3 w-6 h-[2px] bg-brand-warmgray" />
              )}

              <div className={`brand-card p-6 ${step.lightBg} border-transparent hover:shadow-brand-md transition-all`}>
                {/* Step number */}
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center`}
                  >
                    <span className="text-white font-black text-sm font-ui">{step.step}</span>
                  </motion.div>
                  <div className={`flex-1 h-[2px] ${step.color}/20 rounded-full`} />
                </div>

                <div className={`w-14 h-14 rounded-brand-lg ${step.color}/10 flex items-center justify-center mb-4`}>
                  <step.icon className={`w-7 h-7`} style={{ color: step.color === 'bg-brand-green' ? '#00C17A' : step.color === 'bg-brand-blue' ? '#0072F9' : '#FFBC0A' }} />
                </div>

                <h3 className="text-xl font-black text-brand-black font-display mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-brand-charcoal font-bold font-ui leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══════════════════════════ QUICK ACTIONS ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16"
      >
        <motion.div variants={fadeRight}>
          <Link href="/upload" className="group block">
            <motion.div
              whileHover={{ y: -4 }}
              className="brand-card p-6 hover:shadow-brand-lg transition-all duration-300 bg-gradient-to-bl from-brand-greenlight/20 to-transparent border-brand-green/10"
            >
              <div className="flex items-center gap-5">
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  className="w-16 h-16 rounded-brand-lg bg-brand-greenlight flex items-center justify-center flex-shrink-0"
                >
                  <Upload className="w-8 h-8 text-brand-green" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-brand-black font-display mb-1">رفع فيديو أو نص</h3>
                  <p className="text-sm text-brand-muted font-bold font-ui">
                    ارفع ملف فيديو للنسخ التلقائي أو الصق نص البودكاست مباشرة
                  </p>
                </div>
                <ArrowLeft className="w-5 h-5 text-brand-muted group-hover:text-brand-green group-hover:-translate-x-2 transition-all duration-300" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div variants={fadeRight}>
          <Link href="/search" className="group block">
            <motion.div
              whileHover={{ y: -4 }}
              className="brand-card p-6 hover:shadow-brand-lg transition-all duration-300 bg-gradient-to-bl from-brand-aquapale/20 to-transparent border-brand-blue/10"
            >
              <div className="flex items-center gap-5">
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.1 }}
                  className="w-16 h-16 rounded-brand-lg bg-brand-aquapale flex items-center justify-center flex-shrink-0"
                >
                  <Search className="w-8 h-8 text-brand-blue" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-brand-black font-display mb-1">البحث الذكي</h3>
                  <p className="text-sm text-brand-muted font-bold font-ui">
                    ابحث في محتوى جميع البودكاستات واسأل أسئلة بالذكاء الاصطناعي
                  </p>
                </div>
                <ArrowLeft className="w-5 h-5 text-brand-muted group-hover:text-brand-blue group-hover:-translate-x-2 transition-all duration-300" />
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════ VALUE PROPS ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="mb-16"
      >
        <div className="brand-card p-8 bg-brand-black text-white border-transparent">
          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'سرعة فائقة',
                desc: 'تحليل حلقة كاملة في أقل من دقيقة واحدة',
                highlight: 'text-brand-green',
              },
              {
                icon: Globe,
                title: 'دعم العربية',
                desc: 'مُصمّم خصيصاً للمحتوى العربي بدقة عالية',
                highlight: 'text-brand-sky',
              },
              {
                icon: Shield,
                title: 'خصوصية تامة',
                desc: 'محتواك آمن ومشفّر ولا يُخزّن لدى أطراف خارجية',
                highlight: 'text-brand-amber',
              },
            ].map((prop) => (
              <motion.div key={prop.title} variants={fadeUp} className="text-center">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4"
                >
                  <prop.icon className={`w-7 h-7 ${prop.highlight}`} />
                </motion.div>
                <h3 className="text-lg font-black font-display mb-2">{prop.title}</h3>
                <p className="text-sm font-bold text-white/70 font-ui">{prop.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════════════════ RECENT PODCASTS ═══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-brand-black font-display">البودكاستات الأخيرة</h2>
          <Link
            href="/upload"
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            رفع جديد
          </Link>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="brand-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-brand-lg bg-brand-warmgray" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-brand-warmgray rounded-full w-1/3" />
                    <div className="h-3 bg-brand-cream rounded-full w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : podcasts.length > 0 ? (
          <motion.div variants={stagger} className="space-y-3">
            {podcasts.map((podcast) => (
              <motion.div key={podcast.id} variants={fadeUp}>
                <Link href={`/transcript/view?id=${podcast.id}`}>
                  <motion.div
                    whileHover={{ y: -2, x: -2 }}
                    className="brand-card p-5 hover:shadow-brand-lg transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-brand-lg bg-brand-greenlight/30 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-greenlight/60 transition-colors">
                        <Podcast className="w-6 h-6 text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="font-black text-brand-black truncate font-ui text-base">
                            {podcast.title}
                          </h3>
                          <StatusBadge status={podcast.status} />
                        </div>
                        <p className="text-xs text-brand-muted line-clamp-2 font-bold font-ui">
                          {podcast.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2.5 text-xs text-brand-muted font-bold font-ui">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {podcast.duration}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            {podcast.scenesCount} مشهد
                          </span>
                          <span>{podcast.uploadDate}</span>
                        </div>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-brand-muted group-hover:text-brand-green group-hover:-translate-x-2 transition-all duration-300 flex-shrink-0" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={fadeUp}>
            <div className="brand-card p-12 text-center bg-gradient-to-b from-brand-greenlight/10 to-transparent">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl bg-brand-greenlight/40 flex items-center justify-center mx-auto mb-5"
              >
                <Podcast className="w-10 h-10 text-brand-green" />
              </motion.div>
              <h3 className="text-xl font-black text-brand-black font-display mb-2">
                لا توجد بودكاستات بعد
              </h3>
              <p className="text-sm text-brand-muted font-bold font-ui mb-6 max-w-sm mx-auto">
                ابدأ برفع أول بودكاست وشاهد قوة التحليل بالذكاء الاصطناعي
              </p>
              <Link href="/upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-accent flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-black">رفع أول بودكاست</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.section>
    </AppShell>
  );
}
