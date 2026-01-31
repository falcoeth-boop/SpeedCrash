'use client';

import { useMemo, useRef, useCallback } from 'react';
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

/* ------------------------------------------------------------------ */
/*  Helpers — mirror Rocket position logic for explosion placement     */
/* ------------------------------------------------------------------ */

const TIME_TO_CROSS_SCENE = 10;
const X_START = -8;
const X_END = 92;

// You asked: vertical scale should start at 2x.
// We clamp visuals to 2x so the bottom space isn’t wasted.
const Y_MIN_MULTIPLIER = 2;

// Trail tuning (clean “stars”)
const TRAIL_MAX_POINTS = 180;     // keep it light
const TRAIL_SAMPLE_MS = 50;       // 20 samples/sec

function getXFromTime(elapsedTime: number): number {
  if (elapsedTime <= 0) return X_START;
  return Math.min(X_END, (elapsedTime / TIME_TO_CROSS_SCENE) * X_END);
}

function getRocketPosition(multiplier: number, elapsedTime: number): { x: number; y: number } {
  const m = Math.max(multiplier, Y_MIN_MULTIPLIER);
  const yNorm = multiplierToYPosition(m);
  const xPercent = getXFromTime(elapsedTime);
  const yPercent = yNorm * 85;
  return { x: xPercent, y: yPercent };
}

// clamp helper
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
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
  /* ------------------------------ */
  /* Explosion position             */
  /* ------------------------------ */
  const explosionPosition = useMemo(() => {
    return getRocketPosition(currentMultiplier, elapsedTime);
  }, [currentMultiplier, elapsedTime]);

  /* ------------------------------ */
  /* Background intensity           */
  /* ------------------------------ */
  const bgIntensity =
    state === 'FLYING'
      ? Math.min(1, 0.5 + multiplierToYPosition(Math.max(currentMultiplier, Y_MIN_MULTIPLIER)) * 0.5)
      : 1;

  /* ------------------------------ */
  /* Star trail path (past rocket)  */
  /* ------------------------------ */
  const trailRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const lastSampleRef = useRef<number>(0);

  const handleRocketPosition = useCallback(
    (pos: { xPercent: number; yPercent: number; multiplier: number }) => {
      // Only sample while flying/win (when rocket actually moves)
      const active = state === 'FLYING' || state === 'WIN';
      if (!active) return;

      const now = performance.now();
      if (now - lastSampleRef.current < TRAIL_SAMPLE_MS) return;
      lastSampleRef.current = now;

      // push point
      trailRef.current.push({ x: pos.xPercent, y: pos.yPercent, t: now });

      // cap
      if (trailRef.current.length > TRAIL_MAX_POINTS) {
        trailRef.current.splice(0, trailRef.current.length - TRAIL_MAX_POINTS);
      }
    },
    [state]
  );

  // Optionally clear trail when we reset to idle/betting
  if (state === 'IDLE' || state === 'BETTING') {
    if (trailRef.current.length) trailRef.current = [];
  }

  /* ------------------------------ */
  /* Zoom-out + parallax camera     */
  /* ------------------------------ */
  const progress = multiplierToYPosition(Math.max(currentMultiplier, Y_MIN_MULTIPLIER)); // 0..1

  // cameraScale < 1 means “zooming out” (seeing more)
  const cameraScale = clamp(1 - progress * 0.30, 0.70, 1); // tune here

  // Keep the scene “anchored” so it doesn’t look like it shrinks into the center.
  // We scale from bottom-left which feels like we’re zooming out as it climbs.
  const cameraStyle = {
    transformOrigin: 'bottom left',
    transform: `scale(${cameraScale})`,
  } as const;

  // Background parallax: moves slower than the foreground.
  // (No need to modify your Background component.)
  const bgParallax = {
    transform: `translateY(${progress * 10}px) scale(${1 + progress * 0.04})`,
  } as const;

  return (
    <div className="relative w-full max-w-lg aspect-[3/4] min-h-[400px] overflow-hidden rounded-2xl border border-purple-500/20">
      {/* Layer 1: Background (z-0) */}
      <div className="absolute inset-0 z-0" style={bgParallax}>
        <Background intensity={bgIntensity} />
      </div>

      {/* CAMERA WRAPPER: everything that should “zoom out” together */}
      <div className="absolute inset-0" style={cameraStyle}>
        {/* Layer 2: MultiplierScale (z-10, right side) */}
        <div className="absolute inset-0 z-10">
          <MultiplierScale
            currentMultiplier={currentMultiplier}
            targetMultiplier={targetMultiplier}
            state={state}
            // We’ll adjust the ticks inside MultiplierScale.tsx
          />
        </div>

        {/* Layer 2.5: Star trail graph (z-15) */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          {trailRef.current.map((p, idx) => {
            const t = idx / Math.max(1, trailRef.current.length - 1);

            // Newer points brighter; older points fade
            const opacity = 0.05 + (1 - t) * 0.35;
            const size = 2 + (1 - t) * 2; // newer slightly bigger

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
                  boxShadow: `0 0 ${6 + (1 - t) * 6}px rgba(255,255,255,${opacity})`,
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
      </div>

      {/* Layer 5: MultiplierDisplay (z-40, center overlay) */}
      {/* NOTE: Not inside camera wrapper so text stays crisp and stable */}
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
