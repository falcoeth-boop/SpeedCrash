'use client';

import { useMemo, useEffect, useState } from 'react';
import type { CrashState } from '@/types';
import { multiplierToYPosition } from '@/engine/MultiplierCurve';
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
/*  Helpers — mirror Rocket.tsx position logic for explosion placement */
/* ------------------------------------------------------------------ */

function getXFromTime(elapsedTime: number): number {
  if (elapsedTime <= 0) return -8;
  const timeScale = 10;
  return Math.min(92, (elapsedTime / timeScale) * 92);
}

function getRocketPosition(multiplier: number, elapsedTime: number): { x: number; y: number } {
  const yNorm = multiplierToYPosition(multiplier);
  const xPercent = getXFromTime(elapsedTime);
  const yPercent = yNorm * 85; // 0% at 1x, 85% at max
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
  // Calculate explosion position based on the multiplier at time of crash/win.
  // During CRASHED state, currentMultiplier holds the crashPoint value.
  // During WIN state, currentMultiplier holds the targetMultiplier value.
  const explosionPosition = useMemo(() => {
    return getRocketPosition(currentMultiplier, elapsedTime);
  }, [state, currentMultiplier, elapsedTime]);

  // Background intensity ramps with multiplier during flight
  const bgIntensity =
    state === 'FLYING'
      ? Math.min(1, 0.5 + multiplierToYPosition(currentMultiplier) * 0.5)
      : 1;

  /* ------------------------------------------------------------------ */
  /*  ✅ Added: route / trail tracking                                   */
  /* ------------------------------------------------------------------ */

  const [trail, setTrail] = useState<TrailPoint[]>([]);

  // Reset trail when game returns to setup states
  useEffect(() => {
    if (state === 'IDLE' || state === 'BETTING') {
      setTrail([]);
    }
  }, [state]);

  // Record points while flying so we can draw the route behind the rocket
  useEffect(() => {
    const active = state === 'FLYING' || state === 'WIN';
    if (!active) return;

    const pos = getRocketPosition(currentMultiplier, elapsedTime);

    setTrail((prev) => {
      // Avoid storing duplicates (helps performance)
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.x - pos.x) < 0.2 && Math.abs(last.y - pos.y) < 0.2) {
        return prev;
      }

      const next = [...prev, { x: pos.x, y: pos.y, t: performance.now() }];

      const MAX_POINTS = 400;
      if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS);

      return next;
    });
  }, [state, currentMultiplier, elapsedTime]);

  return (
    <div className="relative w-full max-w-lg aspect-[3/4] min-h-[400px] overflow-hidden rounded-2xl border border-purple-500/20">
      {/* Layer 1: Background (z-0) */}
      <div className="absolute inset-0 z-0">
        <Background intensity={bgIntensity} />
      </div>

      {/* Layer 2: MultiplierScale (z-10, right side) */}
      <div className="absolute inset-0 z-10">
        <MultiplierScale
          currentMultiplier={currentMultiplier}
          targetMultiplier={targetMultiplier}
          state={state}
        />
      </div>

      {/* ✅ Added Layer: Route/Graph behind rocket (z-15) */}
      <div className="absolute inset-0 pointer-events-none z-[15]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Glow underlay */}
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={trail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />

          {/* Main line */}
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={trail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />

          {/* Marker at latest point (debug: makes it obvious) */}
          {trail.length > 0 && (
            <circle
              cx={trail[trail.length - 1].x}
              cy={100 - trail[trail.length - 1].y}
              r="1.6"
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
        />
      </div>

      {/* Layer 4: CrashExplosion (z-30, positioned at rocket's last position) */}
      <div className="absolute inset-0 z-30">
        <CrashExplosion
          state={state}
          position={explosionPosition}
          crashPoint={crashPoint ?? undefined}
        />
      </div>

      {/* Layer 5: MultiplierDisplay (z-40, center overlay) */}
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
