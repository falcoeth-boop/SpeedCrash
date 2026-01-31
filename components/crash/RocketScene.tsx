'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
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
/*  Helpers — same as before for explosion placement                   */
/* ------------------------------------------------------------------ */

function getXFromTime(elapsedTime: number): number {
  if (elapsedTime <= 0) return -8;
  const timeScale = 10;
  return Math.min(92, (elapsedTime / timeScale) * 92);
}

function getRocketPosition(multiplier: number, elapsedTime: number): { x: number; y: number } {
  const yNorm = multiplierToYPosition(multiplier);
  const xPercent = getXFromTime(elapsedTime);
  const yPercent = yNorm * 85;
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
  const explosionPosition = useMemo(() => {
    return getRocketPosition(currentMultiplier, elapsedTime);
  }, [currentMultiplier, elapsedTime]);

  const bgIntensity =
    state === 'FLYING'
      ? Math.min(1, 0.5 + multiplierToYPosition(currentMultiplier) * 0.5)
      : 1;

  /* ------------------------------------------------------------------ */
  /*  ✅ Trail points (STATE so it actually renders)                      */
  /* ------------------------------------------------------------------ */

  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const lastSampleRef = useRef<number>(0);

  const TRAIL_SAMPLE_MS = 50;     // 20 samples/sec
  const TRAIL_MAX_POINTS = 250;   // keep light

  const handleRocketPosition = useCallback(
    (pos: { xPercent: number; yPercent: number; multiplier: number }) => {
      const active = state === 'FLYING' || state === 'WIN';
      if (!active) return;

      const now = performance.now();
      if (now - lastSampleRef.current < TRAIL_SAMPLE_MS) return;
      lastSampleRef.current = now;

      setTrailPoints((prev) => {
        const next = [...prev, { x: pos.xPercent, y: pos.yPercent, t: now }];
        if (next.length > TRAIL_MAX_POINTS) {
          next.splice(0, next.length - TRAIL_MAX_POINTS);
        }
        return next;
      });
    },
    [state]
  );

  // Clear trail when going back to setup
  if (state === 'IDLE' || state === 'BETTING') {
    if (trailPoints.length) setTrailPoints([]);
  }

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
        />
      </div>

      {/* ✅ Layer 2.5: Trail (z-15) */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        {trailPoints.map((p, idx) => {
          const t = idx / Math.max(1, trailPoints.length - 1);

          // Make it VERY visible for now (we can refine later)
          const opacity = 0.15 + (1 - t) * 0.55; // newer brighter
          const size = 2 + (1 - t) * 3;          // newer bigger

          return (
            <div
              key={`${p.t}-${idx}`}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: `${p.y}%`,
                width: size,
                height: size,
                opacity,
                background: 'rgba(255,255,255,1)',
                boxShadow: `0 0 ${8 + (1 - t) * 10}px rgba(255,255,255,${opacity})`,
              }}
            />
          );
        })}
      </div>

      {/* Layer 3: Rocket (z-20) */}
      <div className="absolute inset-0 z-20">
        <Rocket
          currentMultiplier={currentMultiplier}
          state={state}
          targetMultiplier={targetMultiplier}
          elapsedTime={elapsedTime}
          onPosition={handleRocketPosition}
        />
      </div>

      {/* Layer 4: CrashExplosion (z-30) */}
      <div className="absolute inset-0 z-30">
        <CrashExplosion
          state={state}
          position={explosionPosition}
          crashPoint={crashPoint ?? undefined}
        />
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
