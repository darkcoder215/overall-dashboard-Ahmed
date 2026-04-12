'use client';

import { motion } from 'framer-motion';

type Status = 'processing' | 'ready' | 'error';

const config: Record<Status, { label: string; color: string; dotColor: string }> = {
  processing: {
    label: 'قيد المعالجة',
    color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    dotColor: 'bg-brand-blue',
  },
  ready: {
    label: 'جاهز',
    color: 'bg-brand-green/10 text-brand-green border-brand-green/20',
    dotColor: 'bg-brand-green',
  },
  error: {
    label: 'خطأ',
    color: 'bg-brand-red/10 text-brand-red border-brand-red/20',
    dotColor: 'bg-brand-red',
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { label, color, dotColor } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border font-ui ${color}`}
    >
      <motion.span
        className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
        animate={status === 'processing' ? { opacity: [1, 0.4, 1] } : undefined}
        transition={status === 'processing' ? { duration: 1.5, repeat: Infinity } : undefined}
      />
      {label}
    </span>
  );
}
