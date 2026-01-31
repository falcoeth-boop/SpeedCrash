'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CRASH_CONFIG } from '@/config/crash-config';

interface UseAutoPlayArgs {
  placeBet: () => void;
  isActive: boolean;
  balance: number;
  betAmount: number;
  paused?: boolean;
}

interface UseAutoPlayReturn {
  autoPlaying: boolean;
  remaining: number;
  startAutoPlay: (count: number) => void;
  stopAutoPlay: () => void;
}

/**
 * Auto-play loop for the crash game.
 *
 * Chains rounds automatically: when isActive goes from true → false
 * (a round just ended), waits autoPlayDelay ms then places the next bet.
 *
 * Stops when: remaining reaches 0, balance < betAmount, manual stop,
 * or paused is true.
 *
 * Options: 5, 10, 25, 50 rounds (enforced by UI, not this hook).
 */
export function useAutoPlay({
  placeBet,
  isActive,
  balance,
  betAmount,
  paused = false,
}: UseAutoPlayArgs): UseAutoPlayReturn {
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Use a ref for remaining so the effect can decrement without stale closure
  const remainingRef = useRef(0);
  const autoPlayingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasActiveRef = useRef(false);

  // Keep refs in sync
  autoPlayingRef.current = autoPlaying;

  // ── Watch for round completion (isActive: true → false) ───────────────
  useEffect(() => {
    if (isActive) {
      wasActiveRef.current = true;
      return;
    }

    // isActive is false — check if it just transitioned from true
    if (!wasActiveRef.current) return;
    wasActiveRef.current = false;

    // Should we stop?
    if (!autoPlayingRef.current || paused || balance < betAmount) {
      if (autoPlayingRef.current) {
        setAutoPlaying(false);
        setRemaining(0);
        remainingRef.current = 0;
      }
      return;
    }

    if (remainingRef.current <= 0) {
      setAutoPlaying(false);
      setRemaining(0);
      return;
    }

    // Consume one round
    remainingRef.current -= 1;
    setRemaining(remainingRef.current);

    // If that was the last round, stop (don't place another bet)
    if (remainingRef.current <= 0) {
      setAutoPlaying(false);
      return;
    }

    // Schedule next bet after delay
    timeoutRef.current = setTimeout(() => {
      placeBet();
    }, CRASH_CONFIG.animation.autoPlayDelay);
  }, [isActive, paused, balance, betAmount, placeBet]);

  // ── Controls ──────────────────────────────────────────────────────────
  const startAutoPlay = useCallback(
    (count: number) => {
      remainingRef.current = count;
      setRemaining(count);
      setAutoPlaying(true);
      // Place the first bet immediately
      placeBet();
    },
    [placeBet],
  );

  const stopAutoPlay = useCallback(() => {
    setAutoPlaying(false);
    setRemaining(0);
    remainingRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { autoPlaying, remaining, startAutoPlay, stopAutoPlay };
}
