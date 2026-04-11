'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-cream border border-brand-warmgray/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-brand-muted" />
      </div>
      <h3 className="text-lg font-bold text-brand-black mb-1 font-display">{title}</h3>
      <p className="text-sm text-brand-muted max-w-sm font-ui">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
