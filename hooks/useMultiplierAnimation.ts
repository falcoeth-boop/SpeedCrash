'use client';

import { useState, useRef, useEffect } from 'react';
import { timeToMultiplier } from '@/engine/MultiplierCurve';

interface UseMultiplierAnimationArgs {
  crashPoint: number;
  targetMultiplier: number;
  isFlying: boolean;
  speedMultiplier?: number;
  onReachTarget: () => void;
  onReachCrash: () => void;
}

interface UseMultiplierAnimationReturn {
  currentMultiplier: number;
  elapsedTime: number;
}

/**
 * 60fps rAF-based animation hook that drives the multiplier climb.
 *
 * When isFlying is true, starts a requestAnimationFrame loop that
 * increments elapsed time each frame and converts it to a multiplier
 * via the exponential curve. Fires onReachTarget or onReachCrash
 * when the appropriate threshold is hit.
 *
 * The crash point is pre-determined — this hook just reveals it visually.
 */
export function useMultiplierAnimation({
  crashPoint,
  targetMultiplier,
  isFlying,
  speedMultiplier = 1,
  onReachTarget,
  onReachCrash,
}: UseMultiplierAnimationArgs): UseMultiplierAnimationReturn {
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Store props in refs so the rAF callback always reads latest values
  // without needing them in the effect dependency array
  const crashPointRef = useRef(crashPoint);
  const targetRef = useRef(targetMultiplier);
  const speedRef = useRef(speedMultiplier);
  const onReachTargetRef = useRef(onReachTarget);
  const onReachCrashRef = useRef(onReachCrash);

  crashPointRef.current = crashPoint;
  targetRef.current = targetMultiplier;
  speedRef.current = speedMultiplier;
  onReachTargetRef.current = onReachTarget;
  onReachCrashRef.current = onReachCrash;

  // Animation internals
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const elapsedRef = useRef(0);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!isFlying) {
      // Stop the loop, hold currentMultiplier at its last value
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    // Reset for a new flight
    elapsedRef.current = 0;
    resolvedRef.current = false;
    setCurrentMultiplier(1.0);
    setElapsedTime(0);
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const deltaTime = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      elapsedRef.current += deltaTime * speedRef.current;
      const mult = timeToMultiplier(elapsedRef.current);

      if (!resolvedRef.current) {
        const cp = crashPointRef.current;
        const tm = targetRef.current;

        // Win check: multiplier reached target AND crash point supports it
        if (mult >= tm && cp >= tm) {
          resolvedRef.current = true;
          setCurrentMultiplier(Math.floor(tm * 100) / 100);
          setElapsedTime(elapsedRef.current);
          onReachTargetRef.current();
          return; // stop loop
        }

        // Crash check: multiplier reached crash point AND it's below target
        if (mult >= cp && cp < tm) {
          resolvedRef.current = true;
          setCurrentMultiplier(Math.floor(cp * 100) / 100);
          setElapsedTime(elapsedRef.current);
          onReachCrashRef.current();
          return; // stop loop
        }
      }

      setCurrentMultiplier(mult);
      setElapsedTime(elapsedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlying]);

  return { currentMultiplier, elapsedTime };
}
