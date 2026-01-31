'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CrashGameState, CrashState, BetHistoryEntry } from '@/types';
import { CRASH_CONFIG } from '@/config/crash-config';
import { resolveCrash, resultToHistoryEntry } from '@/engine/CrashResolver';
import { useMultiplierAnimation } from './useMultiplierAnimation';

interface UseCrashGameReturn {
  gameState: CrashGameState;
  placeBet: () => void;
  setTarget: (n: number) => void;
  setBet: (n: number) => void;
  isActive: boolean;
}

/**
 * Main crash game state machine hook.
 *
 * States: IDLE → LAUNCHING → FLYING → CRASHED | WIN → IDLE
 *
 * Flow:
 * 1. IDLE — player adjusts target multiplier + bet amount
 * 2. placeBet() — validates balance, deducts bet, begins launch countdown
 * 3. LAUNCHING — waits launchCountdown ms, resolves crash point (pre-determined)
 * 4. FLYING — useMultiplierAnimation drives the multiplier up visually
 *    • crashPoint ≥ target → WIN when multiplier hits target
 *    • crashPoint < target → CRASHED when multiplier hits crashPoint
 * 5. WIN — adds winnings to balance, records history, pauses, then IDLE
 * 6. CRASHED — records history, pauses, then IDLE
 *
 * The crash point is resolved BEFORE flying starts. The animation just
 * reveals the outcome visually. The frontend already knows the result.
 *
 * @param speedMultiplier — turbo mode multiplier for animation speed (default 1)
 */
export function useCrashGame(speedMultiplier: number = 1): UseCrashGameReturn {
  // ── Individual state slices ──────────────────────────────────────────
  const [state, setState] = useState<CrashState>('IDLE');
  const [balance, setBalance] = useState(CRASH_CONFIG.startingBalance);
  const [betAmount, setBetAmount] = useState(CRASH_CONFIG.defaultBet);
  const [targetMultiplier, setTargetMultiplier] = useState(CRASH_CONFIG.defaultTarget);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<CrashGameState['lastResult']>(null);
  const [history, setHistory] = useState<BetHistoryEntry[]>([]);

  // ── Refs ──────────────────────────────────────────────────────────────
  const pendingResultRef = useRef<Awaited<ReturnType<typeof resolveCrash>> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────
  const isFlying = state === 'FLYING';
  const isActive = state !== 'IDLE';

  // ── Animation callbacks ───────────────────────────────────────────────
  // These only access refs + stable state setters → safe with empty deps
  const handleReachTarget = useCallback(() => {
    const result = pendingResultRef.current;
    if (!result) return;

    setState('WIN');
    setCrashPoint(result.crashPoint);
    setLastResult(result);
    setBalance(prev => prev + result.winAmount);
    setHistory(prev =>
      [resultToHistoryEntry(result), ...prev].slice(0, CRASH_CONFIG.maxHistoryLength),
    );

    timeoutRef.current = setTimeout(() => {
      setState('IDLE');
      setCrashPoint(null);
      pendingResultRef.current = null;
    }, CRASH_CONFIG.animation.winCelebration);
  }, []);

  const handleReachCrash = useCallback(() => {
    const result = pendingResultRef.current;
    if (!result) return;

    setState('CRASHED');
    setCrashPoint(result.crashPoint);
    setLastResult(result);
    setHistory(prev =>
      [resultToHistoryEntry(result), ...prev].slice(0, CRASH_CONFIG.maxHistoryLength),
    );

    timeoutRef.current = setTimeout(() => {
      setState('IDLE');
      setCrashPoint(null);
      pendingResultRef.current = null;
    }, CRASH_CONFIG.animation.resultPause);
  }, []);

  // ── Multiplier animation ──────────────────────────────────────────────
  const { currentMultiplier, elapsedTime } = useMultiplierAnimation({
    crashPoint: crashPoint ?? 999,
    targetMultiplier,
    isFlying,
    speedMultiplier,
    onReachTarget: handleReachTarget,
    onReachCrash: handleReachCrash,
  });

  // ── Actions ───────────────────────────────────────────────────────────
  const placeBet = useCallback(() => {
    if (state !== 'IDLE') return;
    if (balance < betAmount) return;

    // Deduct bet immediately
    setBalance(prev => prev - betAmount);
    setState('LAUNCHING');

    // Launch countdown → resolve crash → fly
    timeoutRef.current = setTimeout(async () => {
      const result = await resolveCrash(targetMultiplier, betAmount);
      pendingResultRef.current = result;
      setCrashPoint(result.crashPoint);
      setState('FLYING');
    }, CRASH_CONFIG.animation.launchCountdown);
  }, [state, balance, betAmount, targetMultiplier]);

  const setBet = useCallback(
    (amount: number) => {
      if (state !== 'IDLE') return;
      setBetAmount(amount);
    },
    [state],
  );

  const setTarget = useCallback(
    (target: number) => {
      if (state !== 'IDLE') return;
      const clamped = Math.max(
        CRASH_CONFIG.minTarget,
        Math.min(CRASH_CONFIG.maxTarget, target),
      );
      setTargetMultiplier(Math.round(clamped * 100) / 100);
    },
    [state],
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Compose return state ──────────────────────────────────────────────
  const gameState: CrashGameState = {
    state,
    balance,
    betAmount,
    targetMultiplier,
    // During IDLE/LAUNCHING show 1.0; during FLYING/WIN/CRASHED show animated value
    currentMultiplier:
      state === 'IDLE' || state === 'LAUNCHING' ? 1.0 : currentMultiplier,
    elapsedTime:
      state === 'IDLE' || state === 'LAUNCHING' ? 0 : elapsedTime,
    crashPoint,
    lastResult,
    history,
    autoPlayRemaining: 0, // managed externally by useAutoPlay
  };

  return { gameState, placeBet, setTarget, setBet, isActive };
}
