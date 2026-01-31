'use client';

import { useState, useCallback } from 'react';
import type { CrashSessionStats } from '@/types';

const initialStats: CrashSessionStats = {
  totalRounds: 0,
  wins: 0,
  losses: 0,
  totalWagered: 0,
  totalWon: 0,
  biggestWin: 0,
  biggestMultiplier: 0,
  netPnL: 0,
  currentStreak: 0,
};

/**
 * Session statistics tracker for the crash game.
 *
 * Tracks wins, losses, wagers, winnings, biggest multiplier, PnL,
 * and current streak. All in-memory — resets on page refresh.
 */
export function useCrashStats() {
  const [stats, setStats] = useState<CrashSessionStats>(initialStats);

  const recordRound = useCallback(
    (bet: number, won: boolean, winAmount: number, crashPoint: number) => {
      setStats(prev => {
        const totalRounds = prev.totalRounds + 1;
        const wins = prev.wins + (won ? 1 : 0);
        const losses = prev.losses + (won ? 0 : 1);
        const totalWagered = prev.totalWagered + bet;
        const totalWon = prev.totalWon + winAmount;
        const biggestWin = Math.max(prev.biggestWin, winAmount);
        const biggestMultiplier = Math.max(prev.biggestMultiplier, crashPoint);
        const netPnL = totalWon - totalWagered;

        // Streak: positive = consecutive wins, negative = consecutive losses
        let currentStreak: number;
        if (won) {
          currentStreak = prev.currentStreak > 0 ? prev.currentStreak + 1 : 1;
        } else {
          currentStreak = prev.currentStreak < 0 ? prev.currentStreak - 1 : -1;
        }

        return {
          totalRounds,
          wins,
          losses,
          totalWagered,
          totalWon,
          biggestWin,
          biggestMultiplier,
          netPnL,
          currentStreak,
        };
      });
    },
    [],
  );

  const resetStats = useCallback(() => {
    setStats(initialStats);
  }, []);

  return { stats, recordRound, resetStats };
}
