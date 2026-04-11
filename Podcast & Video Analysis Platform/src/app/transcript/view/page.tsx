'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Edit3,
  Check,
  X,
  Trash2,
  Plus,
  Sparkles,
  SlidersHorizontal,
  GripVertical,
  Tag,
  MessageSquare,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Podcast, Scene, SceneMetrics, SceneMetadata } from '@/types';

export default function TranscriptPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TranscriptInner />
    </Suspense>
  );
}

function TranscriptInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') ?? '';

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [metrics, setMetrics] = useState<SceneMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Scene>>({});
  const [showMetrics, setShowMetrics] = useState(false);
  const [expandedScene, setExpandedScene] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [sceneMetadataMap, setSceneMetadataMap] = useState<Record<string, SceneMetadata>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/podcasts/${id}`).then((r) => r.json()),
      fetch(`/api/scenes/${id}`).then((r) => r.json()),
      fetch(`/api/metrics?podcastId=${id}`).then((r) => r.json()),
    ])
      .then(([podcastData, scenesData, metricsData]) => {
        setPodcast(podcastData.podcast);
        setScenes(scenesData.scenes || []);
        setMetrics(metricsData.metrics);
        if (scenesData.metadata) {
          setSceneMetadataMap(scenesData.metadata);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const startEdit = (scene: Scene) => {
    setEditingScene(scene.id);
    setEditValues({ title: scene.title, content: scene.content, summary: scene.summary });
  };

  const saveEdit = async (sceneId: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, ...editValues } : s))
    );
    setEditingScene(null);
    setEditValues({});
  };

  const deleteScene = (sceneId: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
  };

  const addScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newScene: Scene = {
      id: `new-${Date.now()}`,
      podcastId: id,
      title: 'مشهد جديد',
      startTime: lastScene?.endTime || '00:00',
      endTime: lastScene?.endTime || '00:00',
      content: '',
      summary: '',
      topics: [],
      mood: '',
      order: scenes.length + 1,
    };
    setScenes((prev) => [...prev, newScene]);
    setEditingScene(newScene.id);
    setEditValues({ title: newScene.title, content: '', summary: '' });
  };

  const handleReanalyze = async () => {
    if (!metrics) return;
    setReanalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'resegment',
          podcastId: id,
          metrics,
        }),
      });
      const data = await res.json();
      if (data.scenes) {
        setScenes(data.scenes);
        setSceneMetadataMap({});
      }
    } catch {
      // Keep existing scenes on error
    } finally {
      setReanalyzing(false);
    }
  };

  const handleEnrich = async () => {
    try {
      await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcastId: id }),
      });
      // Refresh the page data
      const scenesRes = await fetch(`/api/scenes/${id}`).then(r => r.json());
      setScenes(scenesRes.scenes || []);
    } catch {
      // Non-fatal
    }
  };

  const updateMetricValue = (key: keyof SceneMetrics, value: number | boolean) => {
    if (metrics) {
      setMetrics({ ...metrics, [key]: value });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (!podcast) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-brand-muted font-ui">البودكاست غير موجود</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/')}
          className="p-2 rounded-brand hover:bg-brand-cream text-brand-muted hover:text-brand-black transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-brand-black font-display">{podcast.title}</h1>
            <StatusBadge status={podcast.status} />
          </div>
          <p className="text-xs text-brand-muted mt-0.5 font-ui">
            {podcast.duration} &middot; {scenes.length} مشهد &middot; {podcast.uploadDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMetrics(!showMetrics)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors font-ui ${
              showMetrics
                ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                : 'bg-white border border-brand-warmgray text-brand-charcoal hover:border-brand-muted/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            معايير التقسيم
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="btn-accent flex items-center gap-2 disabled:opacity-50"
          >
            {reanalyzing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            إعادة التحليل
          </motion.button>
        </div>
      </div>

      {/* Metrics Panel */}
      <AnimatePresence>
        {showMetrics && metrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="brand-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-brand-black font-display">معايير تقسيم المشاهد</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMetrics({
                        minDuration: 30,
                        maxDuration: 300,
                        topicChangeThreshold: 0.7,
                        silenceThreshold: 2,
                        mergeShortSegments: true,
                        splitLongSegments: true,
                      });
                    }}
                    className="text-xs text-brand-muted hover:text-brand-black flex items-center gap-1 font-ui"
                  >
                    <RotateCcw className="w-3 h-3" />
                    إعادة تعيين
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Min Duration */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1.5 font-ui">
                    أقل مدة للمشهد (ثانية)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={metrics.minDuration}
                    onChange={(e) =>
                      updateMetricValue('minDuration', Number(e.target.value))
                    }
                    className="w-full accent-brand-green"
                  />
                  <span className="text-xs text-brand-muted font-ui">{metrics.minDuration} ثانية</span>
                </div>

                {/* Max Duration */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1.5 font-ui">
                    أقصى مدة للمشهد (ثانية)
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={600}
                    step={30}
                    value={metrics.maxDuration}
                    onChange={(e) =>
                      updateMetricValue('maxDuration', Number(e.target.value))
                    }
                    className="w-full accent-brand-green"
                  />
                  <span className="text-xs text-brand-muted font-ui">{metrics.maxDuration} ثانية</span>
                </div>

                {/* Topic Threshold */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1.5 font-ui">
                    حساسية تغيير الموضوع
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={metrics.topicChangeThreshold}
                    onChange={(e) =>
                      updateMetricValue('topicChangeThreshold', Number(e.target.value))
                    }
                    className="w-full accent-brand-green"
                  />
                  <span className="text-xs text-brand-muted font-ui">
                    {(metrics.topicChangeThreshold * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Silence Threshold */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1.5 font-ui">
                    عتبة الصمت (ثانية)
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={metrics.silenceThreshold}
                    onChange={(e) =>
                      updateMetricValue('silenceThreshold', Number(e.target.value))
                    }
                    className="w-full accent-brand-green"
                  />
                  <span className="text-xs text-brand-muted font-ui">
                    {metrics.silenceThreshold} ثانية
                  </span>
                </div>

                {/* Toggle: Merge Short */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-charcoal font-ui">
                    دمج المقاطع القصيرة
                  </label>
                  <button
                    onClick={() =>
                      updateMetricValue('mergeShortSegments', !metrics.mergeShortSegments)
                    }
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      metrics.mergeShortSegments
                        ? 'bg-brand-green'
                        : 'bg-brand-warmgray'
                    }`}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm"
                      animate={{
                        right: metrics.mergeShortSegments ? 1 : 'auto',
                        left: metrics.mergeShortSegments ? 'auto' : 1,
                      }}
                    />
                  </button>
                </div>

                {/* Toggle: Split Long */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-charcoal font-ui">
                    تقسيم المقاطع الطويلة
                  </label>
                  <button
                    onClick={() =>
                      updateMetricValue('splitLongSegments', !metrics.splitLongSegments)
                    }
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      metrics.splitLongSegments
                        ? 'bg-brand-green'
                        : 'bg-brand-warmgray'
                    }`}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm"
                      animate={{
                        right: metrics.splitLongSegments ? 1 : 'auto',
                        left: metrics.splitLongSegments ? 'auto' : 1,
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-warmgray/50 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReanalyze}
                  className="btn-accent text-xs px-4 py-2 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  تطبيق المعايير وإعادة التقسيم
                </motion.button>
                <p className="text-xs text-brand-muted font-ui">
                  سيتم إعادة تقسيم المشاهد بناءً على المعايير الجديدة
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reanalyzing Overlay */}
      <AnimatePresence>
        {reanalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="brand-card p-6 mb-6 text-center"
          >
            <LoadingSpinner />
            <p className="text-sm font-bold text-brand-black mt-3 font-display">
              جارٍ إعادة تحليل المحتوى بالذكاء الاصطناعي...
            </p>
            <p className="text-xs text-brand-muted mt-1 font-ui">
              قد تستغرق هذه العملية بضع ثوانٍ
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {scenes.map((scene, i) => (
            <motion.button
              key={scene.id}
              whileHover={{ scale: 1.05 }}
              onClick={() =>
                setExpandedScene(expandedScene === scene.id ? null : scene.id)
              }
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors font-ui ${
                expandedScene === scene.id
                  ? 'bg-brand-green text-white'
                  : 'bg-white border border-brand-warmgray text-brand-charcoal hover:border-brand-muted/30'
              }`}
            >
              {i + 1}. {scene.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Scenes */}
      <div className="space-y-3">
        {scenes.map((scene, index) => {
          const isEditing = editingScene === scene.id;
          const isExpanded = expandedScene === scene.id;

          return (
            <motion.div
              key={scene.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`brand-card overflow-hidden transition-all ${
                isExpanded ? 'ring-1 ring-brand-green/30' : ''
              }`}
            >
              {/* Scene Header */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() =>
                  !isEditing &&
                  setExpandedScene(isExpanded ? null : scene.id)
                }
              >
                <div className="flex items-center gap-2 text-brand-muted">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-bold w-6 h-6 rounded-lg bg-brand-cream flex items-center justify-center font-ui">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      value={editValues.title || ''}
                      onChange={(e) =>
                        setEditValues({ ...editValues, title: e.target.value })
                      }
                      className="w-full bg-white border border-brand-warmgray rounded-lg px-3 py-1.5 text-sm font-bold text-brand-black focus:outline-none focus:border-brand-green/50 font-ui"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="font-bold text-brand-black text-sm truncate font-ui">
                      {scene.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-brand-muted font-ui">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scene.startTime} - {scene.endTime}
                    </span>
                    {scene.mood && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {scene.mood}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {scene.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-[10px] font-medium font-ui"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEdit(scene.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand-green/10 text-brand-green transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingScene(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand-red/10 text-brand-red transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(scene);
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand-cream text-brand-muted hover:text-brand-charcoal transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(scene.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-brand-red/10 text-brand-muted hover:text-brand-red transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-brand-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-brand-muted" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-brand-warmgray/50">
                      {/* Summary */}
                      <div className="mt-3 mb-3">
                        <label className="text-xs font-bold text-brand-muted mb-1 block font-ui">
                          الملخص
                        </label>
                        {isEditing ? (
                          <input
                            value={editValues.summary || ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                summary: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-brand-warmgray rounded-lg px-3 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-green/50 font-ui"
                          />
                        ) : (
                          <p className="text-sm text-brand-charcoal font-medium font-body">
                            {scene.summary}
                          </p>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <label className="text-xs font-bold text-brand-muted mb-1 block font-ui">
                          المحتوى
                        </label>
                        {isEditing ? (
                          <textarea
                            value={editValues.content || ''}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                content: e.target.value,
                              })
                            }
                            rows={5}
                            className="w-full bg-white border border-brand-warmgray rounded-lg px-3 py-2 text-sm text-brand-charcoal leading-relaxed focus:outline-none focus:border-brand-green/50 resize-none font-body"
                          />
                        ) : (
                          <p className="text-sm text-brand-charcoal/80 leading-relaxed font-body">
                            {scene.content}
                          </p>
                        )}
                      </div>

                      {/* Topics */}
                      <div className="mt-3 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-brand-muted" />
                        <div className="flex flex-wrap gap-1.5">
                          {scene.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-medium font-ui"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Scene Metadata (if available) */}
                      {sceneMetadataMap[scene.id] && (
                        <div className="mt-3 pt-3 border-t border-brand-warmgray/30 space-y-2">
                          {sceneMetadataMap[scene.id].keywords.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-brand-muted font-ui">كلمات مفتاحية:</span>
                              <div className="flex flex-wrap gap-1">
                                {sceneMetadataMap[scene.id].keywords.map((kw) => (
                                  <span key={kw} className="px-1.5 py-0.5 rounded bg-brand-green/10 text-brand-green text-[10px] font-medium font-ui">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {sceneMetadataMap[scene.id].entities.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-brand-muted font-ui">كيانات:</span>
                              <div className="flex flex-wrap gap-1">
                                {sceneMetadataMap[scene.id].entities.map((e) => (
                                  <span key={e.name} className="px-1.5 py-0.5 rounded bg-brand-amber/10 text-brand-charcoal text-[10px] font-medium font-ui">
                                    {e.name} <span className="text-brand-muted">({e.type})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-brand-muted font-ui">
                            <span>المشاعر: {
                              { positive: '😊 إيجابي', negative: '😟 سلبي', neutral: '😐 محايد', mixed: '🔄 مختلط' }[sceneMetadataMap[scene.id].sentiment]
                            }</span>
                            <span>التصنيف: {sceneMetadataMap[scene.id].topicCategory}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Add Scene Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={addScene}
          className="w-full brand-card p-4 flex items-center justify-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-green hover:ring-1 hover:ring-brand-green/20 transition-all font-ui"
        >
          <Plus className="w-4 h-4" />
          إضافة مشهد جديد
        </motion.button>
      </div>
    </AppShell>
  );
}
