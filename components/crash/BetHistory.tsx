'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BetHistoryEntry } from '@/types';
import { formatMultiplier } from '@/engine/MultiplierCurve';
import { CRASH_CONFIG } from '@/config/crash-config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  history: BetHistoryEntry[];
}

/* ------------------------------------------------------------------ */
/*  Color helper                                                       */
/* ------------------------------------------------------------------ */

function getBadgeColors(crashPoint: number): string {
  if (crashPoint >= 10) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (crashPoint >= 2) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function BetHistory({ history }: Props) {
  const visible = history.slice(0, CRASH_CONFIG.maxHistoryLength);

  if (visible.length === 0) {
    return (
      <div className="px-4 py-2">
        <p className="text-xs text-white/25 text-center">No rounds yet</p>
      </div>
    );
  }

  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-4 py-2
                 scrollbar-hide"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <AnimatePresence initial={false}>
        {visible.map((entry) => (
          <motion.span
            key={entry.id}
            layout
            initial={{ opacity: 0, scale: 0.6, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold
                        tabular-nums border whitespace-nowrap
                        ${getBadgeColors(entry.crashPoint)}`}
          >
            {formatMultiplier(entry.crashPoint)}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
