'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CrashResult, BetHistoryEntry } from '@/types';
import { CRASH_CONFIG } from '@/config/crash-config';
import { formatMultiplier } from '@/engine/MultiplierCurve';
import { useCrashGame } from '@/hooks/useCrashGame';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { useCrashStats } from '@/hooks/useCrashStats';
import { RocketScene } from './RocketScene';

/* ================================================================== */
/*  Inline placeholder components (Phase 4E will replace these)        */
/* ================================================================== */

/** Scrolling bet history bar showing recent crash points */
function BetHistory({ history }: { history: BetHistoryEntry[] }) {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-lg px-2 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {history.map((entry) => {
            const isHigh = entry.crashPoint >= 2;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                  isHigh
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {formatMultiplier(entry.crashPoint)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Stats bar showing session stats */
function CrashStatsBar({
  stats,
}: {
  stats: {
    totalRounds: number;
    wins: number;
    losses: number;
    netPnL: number;
    biggestWin: number;
  };
}) {
  if (stats.totalRounds === 0) return null;

  return (
    <div className="w-full max-w-lg px-4 py-2">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-white/40">
          W:{stats.wins} L:{stats.losses}
        </span>
        <span
          className={
            stats.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }
        >
          PnL: {stats.netPnL >= 0 ? '+' : ''}
          {stats.netPnL.toFixed(2)}
        </span>
        {stats.biggestWin > 0 && (
          <span className="text-amber-400">
            Best: {stats.biggestWin.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Bet controls — target selector + bet amount + place bet button */
function BetControls({
  betAmount,
  targetMultiplier,
  balance,
  isActive,
  onBetChange,
  onTargetChange,
  onPlaceBet,
}: {
  betAmount: number;
  targetMultiplier: number;
  balance: number;
  isActive: boolean;
  onBetChange: (amount: number) => void;
  onTargetChange: (target: number) => void;
  onPlaceBet: () => void;
}) {
  const isIdle = !isActive;

  return (
    <div className="w-full max-w-lg px-4 py-3 space-y-3">
      {/* Target multiplier presets */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
          Target Multiplier
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {CRASH_CONFIG.targetPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onTargetChange(preset)}
              disabled={!isIdle}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                Math.abs(targetMultiplier - preset) < 0.001
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-40'
              }`}
            >
              {formatMultiplier(preset)}
            </button>
          ))}
        </div>
      </div>

      {/* Bet amount options */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">
          Bet Amount
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {CRASH_CONFIG.betOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onBetChange(opt)}
              disabled={!isIdle || opt > balance}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                betAmount === opt
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-40'
              }`}
            >
              ${opt}
            </button>
          ))}
        </div>
      </div>

      {/* Place bet button */}
      <button
        onClick={onPlaceBet}
        disabled={!isIdle || balance < betAmount}
        className={`w-full py-3.5 rounded-xl text-lg font-black uppercase tracking-wider transition-all ${
          isIdle && balance >= betAmount
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-[0.98]'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        }`}
      >
        {!isIdle
          ? 'In Flight...'
          : balance < betAmount
            ? 'Insufficient Balance'
            : `Launch — $${betAmount}`}
      </button>
    </div>
  );
}

/* ================================================================== */
/*  Auto-play controls                                                 */
/* ================================================================== */

function AutoPlayControls({
  autoPlaying,
  remaining,
  isActive,
  onStart,
  onStop,
}: {
  autoPlaying: boolean;
  remaining: number;
  isActive: boolean;
  onStart: (count: number) => void;
  onStop: () => void;
}) {
  if (autoPlaying) {
    return (
      <div className="w-full max-w-lg px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-amber-400 font-mono">
            Auto: {remaining} remaining
          </span>
          <button
            onClick={onStop}
            className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg px-4 py-2">
      <div className="flex gap-2 items-center">
        <span className="text-xs text-white/40 uppercase tracking-wider mr-1">
          Auto
        </span>
        {CRASH_CONFIG.autoPlayOptions.map((count) => (
          <button
            key={count}
            onClick={() => onStart(count)}
            disabled={isActive}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30 transition-all"
          >
            {count}x
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main CrashGame Orchestrator                                        */
/* ================================================================== */

export function CrashGame() {
  // ── Hook wiring ────────────────────────────────────────────────────
  const { gameState, placeBet, setTarget, setBet, isActive } = useCrashGame();
  const { stats, recordRound } = useCrashStats();
  const { autoPlaying, remaining, startAutoPlay, stopAutoPlay } = useAutoPlay({
    placeBet,
    isActive,
    balance: gameState.balance,
    betAmount: gameState.betAmount,
  });

  // ── Record stats when a round ends ─────────────────────────────────
  // Track the last recorded result timestamp to avoid double-recording
  const lastRecordedTimestampRef = useRef<number>(0);

  useEffect(() => {
    const result = gameState.lastResult;
    if (!result) return;
    if (result.timestamp === lastRecordedTimestampRef.current) return;

    lastRecordedTimestampRef.current = result.timestamp;
    recordRound(
      result.betAmount,
      result.won,
      result.winAmount,
      result.crashPoint,
    );
  }, [gameState.lastResult, recordRound]);

  // ── Layout ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-lg px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Barnyard Bolt{' '}
            <span className="text-2xl" role="img" aria-label="chicken">
              🐔
            </span>
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-wider">
            Crash Game
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            Balance
          </p>
          <p className="text-lg font-bold text-amber-400 tabular-nums">
            ${gameState.balance.toFixed(2)}
          </p>
        </div>
      </header>

      {/* Bet history */}
      <BetHistory history={gameState.history} />

      {/* Rocket scene */}
      <div className="w-full flex justify-center px-4 py-2">
        <RocketScene
          currentMultiplier={gameState.currentMultiplier}
          targetMultiplier={gameState.targetMultiplier}
          crashPoint={gameState.crashPoint}
          state={gameState.state}
          elapsedTime={gameState.elapsedTime}
        />
      </div>

      {/* Stats bar */}
      <CrashStatsBar stats={stats} />

      {/* Bet controls */}
      <BetControls
        betAmount={gameState.betAmount}
        targetMultiplier={gameState.targetMultiplier}
        balance={gameState.balance}
        isActive={isActive}
        onBetChange={setBet}
        onTargetChange={setTarget}
        onPlaceBet={placeBet}
      />

      {/* Auto-play controls */}
      <AutoPlayControls
        autoPlaying={autoPlaying}
        remaining={remaining}
        isActive={isActive}
        onStart={startAutoPlay}
        onStop={stopAutoPlay}
      />

      {/* Bottom spacer for mobile */}
      <div className="h-8" />
    </div>
  );
}
