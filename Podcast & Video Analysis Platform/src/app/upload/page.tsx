'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ClipboardPaste,
  Link as LinkIcon,
  Video,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/ui/PageHeader';

type UploadMode = 'video' | 'video-url' | 'transcript' | null;
type Stage = 'idle' | 'uploading' | 'transcribing' | 'segmenting' | 'enriching' | 'embedding' | 'complete' | 'error';

const stageLabels: Record<Stage, string> = {
  idle: '',
  uploading: 'جارٍ رفع الملف...',
  transcribing: 'جارٍ النسخ التلقائي...',
  segmenting: 'جارٍ تقسيم المشاهد...',
  enriching: 'جارٍ إثراء البيانات الوصفية...',
  embedding: 'جارٍ إنشاء فهرس البحث الذكي...',
  complete: 'اكتمل بنجاح!',
  error: 'حدث خطأ',
};

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<UploadMode>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const pollPipelineStatus = useCallback(async (podcastId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/pipeline-status/${podcastId}`);
        const data = await res.json();

        if (data.stage) {
          setStage(data.stage as Stage);
          setProgress(data.progress || 0);
        }

        if (data.stage === 'complete') {
          setTimeout(() => {
            router.push(`/transcript/${podcastId}`);
          }, 1500);
          return;
        }

        if (data.stage === 'error') {
          setError(data.error || 'حدث خطأ أثناء التحليل');
          setStage('idle');
          setProgress(0);
          return;
        }

        // Keep polling
        setTimeout(poll, 1500);
      } catch {
        setError('فقد الاتصال بالخادم');
        setStage('idle');
        setProgress(0);
      }
    };
    poll();
  }, [router]);

  const handleSubmit = async () => {
    if (mode === 'video' && !selectedFile) {
      setError('الرجاء اختيار ملف فيديو');
      return;
    }
    if (mode === 'video-url' && !videoUrl.trim()) {
      setError('الرجاء إدخال رابط الفيديو');
      return;
    }
    if (mode === 'transcript' && !transcript.trim()) {
      setError('الرجاء إدخال نص البودكاست');
      return;
    }
    if (!title.trim()) {
      setError('الرجاء إدخال عنوان البودكاست');
      return;
    }

    setError('');

    try {
      // ── File upload mode ──
      if (mode === 'video' && selectedFile) {
        setStage('uploading');
        setProgress(5);

        // Step 1: Upload and transcribe the file
        const formData = new FormData();
        formData.append('file', selectedFile);

        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!analyzeRes.ok) {
          const errData = await analyzeRes.json();
          throw new Error(errData.error || 'فشل نسخ الملف');
        }

        const analyzeData = await analyzeRes.json();
        const transcriptData = JSON.parse(analyzeData.result);
        setProgress(30);

        // Step 2: Create podcast and run pipeline with transcript
        const res = await fetch('/api/podcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            mode: 'upload',
            transcript: transcriptData.fullTranscript,
          }),
        });

        const data = await res.json();
        pollPipelineStatus(data.id);
        return;
      }

      // ── Video URL mode ──
      if (mode === 'video-url' && videoUrl.trim()) {
        setStage('transcribing');
        setProgress(10);

        // Create podcast with videoUrl — pipeline handles transcription + rest
        const res = await fetch('/api/podcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            mode: 'video-url',
            videoUrl: videoUrl.trim(),
          }),
        });

        const data = await res.json();
        pollPipelineStatus(data.id);
        return;
      }

      // ── Transcript mode ──
      if (mode === 'transcript' && transcript.trim()) {
        setStage('segmenting');
        setProgress(10);

        const res = await fetch('/api/podcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            mode: 'transcript',
            transcript,
          }),
        });

        const data = await res.json();
        pollPipelineStatus(data.id);
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء المعالجة. الرجاء المحاولة مرة أخرى.'
      );
      setStage('idle');
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const isProcessing = stage !== 'idle' && stage !== 'complete';

  return (
    <AppShell>
      <PageHeader
        title="رفع محتوى جديد"
        subtitle="ارفع فيديو أو أدخل رابط YouTube أو الصق نص البودكاست"
      />

      {/* Processing Overlay */}
      <AnimatePresence>
        {(isProcessing || stage === 'complete') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="brand-card p-8 w-full max-w-md text-center"
            >
              {stage === 'complete' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-brand-green mx-auto mb-4" />
                </motion.div>
              ) : (
                <div className="mb-4">
                  <Loader2 className="w-12 h-12 text-brand-green mx-auto animate-spin" />
                </div>
              )}
              <h3 className="text-lg font-bold text-brand-black mb-2 font-display">
                {stageLabels[stage]}
              </h3>
              <div className="w-full bg-brand-warmgray rounded-full h-2 mb-3">
                <motion.div
                  className="h-full rounded-full bg-brand-green"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-brand-muted font-ui">{progress}%</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selection */}
      <AnimatePresence mode="wait">
        {!mode ? (
          <motion.div
            key="mode-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('video')}
              className="brand-card p-6 text-right hover:shadow-brand-md transition-all group"
            >
              <div className="w-12 h-12 rounded-brand-lg bg-brand-greenlight/40 flex items-center justify-center mb-4 group-hover:bg-brand-greenlight transition-colors">
                <FileVideo className="w-6 h-6 text-brand-green" />
              </div>
              <h3 className="text-base font-bold text-brand-black mb-1.5 font-display">
                رفع ملف فيديو
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed font-ui">
                ارفع ملف فيديو أو صوت وسيتم نسخه تلقائياً ثم تقسيمه
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-muted font-ui">
                <Sparkles className="w-3 h-3 text-brand-green" />
                نسخ تلقائي + تقسيم ذكي
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('video-url')}
              className="brand-card p-6 text-right hover:shadow-brand-md transition-all group relative"
            >
              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold font-ui">
                  ذكاء اصطناعي
                </span>
              </div>
              <div className="w-12 h-12 rounded-brand-lg bg-brand-paleyellow/40 flex items-center justify-center mb-4 group-hover:bg-brand-paleyellow transition-colors">
                <LinkIcon className="w-6 h-6 text-brand-amber" />
              </div>
              <h3 className="text-base font-bold text-brand-black mb-1.5 font-display">
                رابط فيديو
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed font-ui">
                أدخل رابط YouTube أو رابط فيديو مباشر لتحليله تلقائياً
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-muted font-ui">
                <Video className="w-3 h-3 text-brand-amber" />
                تحليل فيديو مباشر بالذكاء الاصطناعي
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('transcript')}
              className="brand-card p-6 text-right hover:shadow-brand-md transition-all group"
            >
              <div className="w-12 h-12 rounded-brand-lg bg-brand-aquapale/40 flex items-center justify-center mb-4 group-hover:bg-brand-aquapale transition-colors">
                <ClipboardPaste className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-base font-bold text-brand-black mb-1.5 font-display">
                لصق نص البودكاست
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed font-ui">
                الصق نصاً من أي مصدر وسيتم تحليله وتقسيمه إلى مشاهد
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-muted font-ui">
                <Sparkles className="w-3 h-3 text-brand-blue" />
                تحليل فوري + تقسيم ذكي
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl space-y-6"
          >
            {/* Back button */}
            <button
              onClick={() => {
                setMode(null);
                setSelectedFile(null);
                setTranscript('');
                setVideoUrl('');
                setTitle('');
                setError('');
              }}
              className="text-sm text-brand-muted hover:text-brand-black transition-colors font-ui"
            >
              &#8594; العودة لاختيار الطريقة
            </button>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-brand-black mb-2 font-ui">
                عنوان البودكاست
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: سوالف بزنس - الحلقة 50"
                className="w-full bg-white border border-brand-warmgray rounded-brand px-4 py-3 text-brand-black placeholder-brand-muted/50 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-colors text-sm font-ui"
              />
            </div>

            {/* Video File Upload */}
            {mode === 'video' && (
              <div>
                <label className="block text-sm font-bold text-brand-black mb-2 font-ui">
                  ملف الفيديو / الصوت
                </label>
                <motion.div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  animate={{
                    borderColor: dragOver ? '#00C17A' : '#EFEDE2',
                  }}
                  className="border-2 border-dashed rounded-brand-lg p-10 text-center cursor-pointer hover:border-brand-green/40 transition-colors bg-white"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileVideo className="w-8 h-8 text-brand-green" />
                      <div className="text-right">
                        <p className="font-bold text-brand-black text-sm font-ui">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-brand-muted font-ui">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} ميجابايت
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="p-1 hover:bg-brand-cream rounded-lg"
                      >
                        <X className="w-4 h-4 text-brand-muted" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-brand-muted/50 mx-auto mb-3" />
                      <p className="font-bold text-brand-black text-sm mb-1 font-ui">
                        اسحب الملف هنا أو اضغط للاختيار
                      </p>
                      <p className="text-xs text-brand-muted font-ui">
                        MP4, MP3, WAV, MOV - حتى 500 ميجابايت
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            )}

            {/* Video URL */}
            {mode === 'video-url' && (
              <div>
                <label className="block text-sm font-bold text-brand-black mb-2 font-ui">
                  رابط الفيديو
                </label>
                <div className="relative">
                  <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... أو رابط فيديو مباشر"
                    dir="ltr"
                    className="w-full bg-white border border-brand-warmgray rounded-brand pr-10 pl-4 py-3 text-brand-black placeholder-brand-muted/50 focus:outline-none focus:border-brand-amber/50 focus:ring-1 focus:ring-brand-amber/20 transition-colors text-sm font-ui text-left"
                  />
                </div>
                <div className="mt-2 p-3 rounded-brand bg-brand-paleyellow/20 border border-brand-amber/10">
                  <p className="text-xs text-brand-charcoal font-ui leading-relaxed">
                    <strong>الصيغ المدعومة:</strong> روابط YouTube، MP4، MPEG، MOV، WebM.
                    سيتم تحليل الفيديو مباشرة بالذكاء الاصطناعي لاستخراج المشاهد والمواضيع.
                  </p>
                </div>
              </div>
            )}

            {/* Transcript Paste */}
            {mode === 'transcript' && (
              <div>
                <label className="block text-sm font-bold text-brand-black mb-2 font-ui">
                  نص البودكاست
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="الصق نص البودكاست هنا... يمكنك نسخه من يوتيوب أو أي مصدر آخر"
                  rows={12}
                  className="w-full bg-white border border-brand-warmgray rounded-brand px-4 py-3 text-brand-black placeholder-brand-muted/50 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/20 transition-colors text-sm leading-relaxed resize-none font-body"
                />
                <p className="text-xs text-brand-muted mt-1 font-ui">
                  {transcript.length > 0
                    ? `${transcript.split(/\s+/).filter(Boolean).length} كلمة`
                    : 'انسخ نص البودكاست من يوتيوب أو أي منصة أخرى'}
                </p>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-brand-red text-sm bg-brand-red/5 border border-brand-red/10 p-3 rounded-brand font-ui"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full btn-accent py-3.5 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mode === 'video-url' ? (
                <Video className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {mode === 'video-url'
                ? 'تحليل الفيديو بالذكاء الاصطناعي'
                : 'بدء التحليل بالذكاء الاصطناعي'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
