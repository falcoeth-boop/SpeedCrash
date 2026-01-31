'use client';

import { motion } from 'framer-motion';
import { CrashSessionStats } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  stats: CrashSessionStats;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CrashStatsBar({ stats }: Props) {
  const winRate =
    stats.totalRounds > 0
      ? ((stats.wins / stats.totalRounds) * 100).toFixed(0)
      : null;

  return (
    <div
      className="flex items-center justify-center gap-x-3 flex-wrap
                 px-4 py-1.5 text-sm tabular-nums text-purple-300/60"
    >
      <span>
        Rounds: <span className="text-white/70">{stats.totalRounds}</span>
      </span>

      <span className="text-purple-500/30">|</span>

      <span>
        W/L:{' '}
        <span className="text-white/70">
          {stats.wins}/{stats.losses}
        </span>
        {winRate !== null && (
          <span className="text-white/40 ml-1">({winRate}%)</span>
        )}
      </span>

      <span className="text-purple-500/30">|</span>

      <span>
        Wagered:{' '}
        <span className="text-white/70">${stats.totalWagered.toFixed(2)}</span>
      </span>

      <span className="text-purple-500/30">|</span>

      <span>
        P&amp;L:{' '}
        <motion.span
          key={stats.netPnL.toFixed(2)}
          initial={{ opacity: 0.5, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={
            stats.netPnL >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'
          }
        >
          {formatCurrency(stats.netPnL)}
        </motion.span>
      </span>
    </div>
  );
}
