'use client';

import { useMemo, useEffect, useState } from 'react';
import type { CrashState } from '@/types';
import { multiplierToYPosition } from '@/engine/MultiplierCurve';
import Background from './Background';
import MultiplierScale from './MultiplierScale';
import { Rocket } from './Rocket';
import { CrashExplosion } from './CrashExplosion';
import { MultiplierDisplay } from './MultiplierDisplay';

interface RocketSceneProps {
  currentMultiplier: number;
  targetMultiplier: number;
  crashPoint: number | null;
  state: CrashState;
  elapsedTime: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers — mirror Rocket.tsx position logic for trail/explosion      */
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

type TrailPoint = { x: number; y: number; t: number };

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
  /*  ✅ NEW: trail points (behind the rocket)                            */
  /* ------------------------------------------------------------------ */

  const [trail, setTrail] = useState<TrailPoint[]>([]);

  // Reset trail when game goes back to setup/betting
  useEffect(() => {
    if (state === 'IDLE' || state === 'BETTING') {
      setTrail([]);
    }
  }, [state]);

  // Add a point while flying/win
  useEffect(() => {
    const active = state === 'FLYING' || state === 'WIN';
    if (!active) return;

    const pos = getRocketPosition(currentMultiplier, elapsedTime);

    setTrail((prev) => {
      const next = [...prev, { x: pos.x, y: pos.y, t: performance.now() }];

      // Keep it light
      const MAX_POINTS = 240;
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

      {/* ✅ NEW Layer: Trail behind rocket (z-15) */}
      <div className="absolute inset-0 pointer-events-none z-[15]">
        {trail.map((p, i) => {
          const t = i / Math.max(1, trail.length - 1);

          // Make it visible (we’ll refine style later)
          const opacity = 0.15 + (1 - t) * 0.6; // newer points brighter
          const size = 2 + (1 - t) * 3;

          return (
            <div
              key={`${p.t}-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: `${p.y}%`,
                width: size,
                height: size,
                opacity,
                background: 'rgba(255,255,255,1)',
                boxShadow: `0 0 ${6 + (1 - t) * 12}px rgba(255,255,255,${opacity})`,
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
