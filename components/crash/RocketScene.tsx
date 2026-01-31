'use client';

import { useMemo, useEffect, useState } from 'react';
import type { CrashState } from '@/types';
import Background from './Background';
import MultiplierScale from './MultiplierScale';
import { Rocket } from './Rocket';
import { CrashExplosion } from './CrashExplosion';
import { MultiplierDisplay } from './MultiplierDisplay';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RocketSceneProps {
  currentMultiplier: number;
  targetMultiplier: number;
  crashPoint: number | null;
  state: CrashState;
  elapsedTime: number;
}

type TrailPoint = { x: number; y: number; t: number };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * X position: seconds-based.
 * ~10s to cross the full scene width.
 */
function getXFromTime(elapsedTime: number): number {
  if (elapsedTime <= 0) return -8;
  const timeScale = 10;
  return Math.min(92, (elapsedTime / timeScale) * 92);
}

/**
 * Bustabit-like "viewport" max for Y axis.
 * Keeps movement visible by expanding range only when needed.
 */
function getTargetYMax(multiplier: number): number {
  if (multiplier < 2) return 2;
  if (multiplier < 5) return 5;
  if (multiplier < 10) return 10;
  if (multiplier < 20) return 20;
  if (multiplier < 50) return 50;
  if (multiplier < 100) return 100;
  return 250;
}

/**
 * Shared Y mapping for Rocket + Trail + Scale.
 * Uses log mapping from 1..yMax => 0..(Y_TOP)%.
 */
function multiplierToViewportYPercent(multiplier: number, yMax: number): number {
  const Y_TOP = 85; // keep headroom like your original
  const m = Math.max(1, Math.min(multiplier, yMax));
  if (yMax <= 1) return 0;

  // log curve: 1 => 0, yMax => 1
  const yNorm = Math.log(m) / Math.log(yMax);
  return yNorm * Y_TOP;
}

function getRocketPosition(
  multiplier: number,
  elapsedTime: number,
  yMax: number
): { x: number; y: number } {
  const xPercent = getXFromTime(elapsedTime);
  const yPercent = multiplierToViewportYPercent(multiplier, yMax);
  return { x: xPercent, y: yPercent };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RocketScene({
  currentMultiplier,
  targetMultiplier,
  crashPoint,
  state,
  elapsedTime,
}: RocketSceneProps) {
  /* ------------------------------------------------------------------ */
  /*  ✅ Bustabit-like dynamic Y-axis viewport (smoothed)                 */
  /* ------------------------------------------------------------------ */

  const [yMax, setYMax] = useState<number>(2);

  useEffect(() => {
    // Reset when returning to setup
    if (state === 'IDLE' || state === 'BETTING') {
      setYMax(2);
      return;
    }

    // Expand range gradually (smooth zoom-out feeling)
    const desired = getTargetYMax(currentMultiplier);
    setYMax((prev) => {
      // Only grow, don’t shrink mid-round (prevents jitter)
      const next = Math.max(prev, desired);

      // small smoothing step so it doesn't "jump"
      const lerp = 0.15;
      return prev + (next - prev) * lerp;
    });
  }, [state, currentMultiplier]);

  /* ------------------------------------------------------------------ */
  /*  Explosion position uses the SAME mapping (fixes mismatch)          */
  /* ------------------------------------------------------------------ */

  const explosionPosition = useMemo(() => {
    return getRocketPosition(currentMultiplier, elapsedTime, yMax);
  }, [currentMultiplier, elapsedTime, yMax]);

  /* ------------------------------------------------------------------ */
  /*  Background intensity                                               */
  /* ------------------------------------------------------------------ */

  const bgIntensity = state === 'FLYING' ? 1 : 1;

  /* ------------------------------------------------------------------ */
  /*  ✅ Route / trail tracking                                          */
  /* ------------------------------------------------------------------ */

  const [trail, setTrail] = useState<TrailPoint[]>([]);

  useEffect(() => {
    if (state === 'IDLE' || state === 'BETTING') setTrail([]);
  }, [state]);

  useEffect(() => {
    const active = state === 'LAUNCHING' || state === 'FLYING' || state === 'WIN';
    if (!active) return;

    const pos = getRocketPosition(currentMultiplier, elapsedTime, yMax);

    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.x - pos.x) < 0.15 && Math.abs(last.y - pos.y) < 0.15) {
        return prev;
      }

      const next = [...prev, { x: pos.x, y: pos.y, t: performance.now() }];

      const MAX_POINTS = 600;
      if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS);

      return next;
    });
  }, [state, currentMultiplier, elapsedTime, yMax]);

  return (
    <div className="relative w-full max-w-lg aspect-[3/4] min-h-[400px] overflow-hidden rounded-2xl border border-purple-500/20">
      {/* Layer 1: Background (z-0) */}
      <div className="absolute inset-0 z-0">
        <Background intensity={bgIntensity} />
      </div>

      {/* Layer 2: MultiplierScale (z-10) */}
      <div className="absolute inset-0 z-10">
        <MultiplierScale
          currentMultiplier={currentMultiplier}
          targetMultiplier={targetMultiplier}
          state={state}
          yMax={yMax} // ✅ new
        />
      </div>

      {/* ✅ Layer: Route/Graph behind rocket (z-19) */}
      <div className="absolute inset-0 pointer-events-none z-[19]">
        <svg viewBox="-8 0 108 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* Glow underlay */}
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={trail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />
          {/* Main line */}
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.9"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={trail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />

          {/* Debug marker (keep it until you confirm) */}
          {trail.length > 0 && (
            <circle
              cx={trail[trail.length - 1].x}
              cy={100 - trail[trail.length - 1].y}
              r="1.4"
              fill="rgba(0,255,255,1)"
            />
          )}
        </svg>
      </div>

      {/* Layer 3: Rocket (z-20) */}
      <div className="absolute inset-0 z-20">
        <Rocket
          currentMultiplier={currentMultiplier}
          state={state}
          targetMultiplier={targetMultiplier}
          elapsedTime={elapsedTime}
          yMax={yMax} // ✅ new
        />
      </div>

      {/* Layer 4: CrashExplosion (z-30) */}
      <div className="absolute inset-0 z-30">
        <CrashExplosion state={state} position={explosionPosition} crashPoint={crashPoint ?? undefined} />
      </div>

      {/* Layer 5: MultiplierDisplay (z-40) */}
      <div className="absolute inset-0 z-40">
        <MultiplierDisplay
          currentMultiplier={currentMultiplier}
          targetMultiplier={targetMultiplier}
          state={state}
          crashPoint={crashPoint ?? undefined}
        />
      </div>
    </div>
  );
}
