'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import type { CrashState } from '@/types';
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

/** store WORLD points (time, multiplier). We convert to screen each render */
type WorldPoint = { t: number; m: number };

const VIEW_SECONDS = 10;
const X_START = -8;
const X_PIN = 86;

const Y_TOP = 85;
const Y_PIN = 68; // where the rocket stays pinned vertically after 10s (tweak 62-72)

/** bustabit step ladder */
function getTargetYMax(multiplier: number): number {
  if (multiplier < 2) return 2;
  if (multiplier < 5) return 5;
  if (multiplier < 10) return 10;
  if (multiplier < 20) return 20;
  if (multiplier < 50) return 50;
  if (multiplier < 100) return 100;
  return 250;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** base log mapping 1..yMax -> 0..Y_TOP */
function baseYPercent(multiplier: number, yMax: number): number {
  const max = Math.max(2, yMax);
  const m = clamp(multiplier, 1, max);
  const yNorm = Math.log(m) / Math.log(max); // 1=>0, yMax=>1
  return yNorm * Y_TOP;
}

/** camera X mapping: world time -> screen percent */
function xFromTime(t: number, xMin: number, xMax: number): number {
  const span = Math.max(0.0001, xMax - xMin);
  const p = clamp((t - xMin) / span, 0, 1); // 0..1
  return X_START + p * (X_PIN - X_START);
}

export function RocketScene({
  currentMultiplier,
  targetMultiplier,
  crashPoint,
  state,
  elapsedTime,
}: RocketSceneProps) {
  const isSetup = state === 'IDLE' || state === 'BETTING';
  const isActive = state === 'LAUNCHING' || state === 'FLYING' || state === 'WIN';

  /** ---------------------------
   *  CAMERA: yMax (step + smooth)
   * --------------------------- */
  const [yMax, setYMax] = useState<number>(2);

  useEffect(() => {
    if (isSetup) {
      setYMax(2);
      return;
    }
    const desired = getTargetYMax(currentMultiplier);

    setYMax((prev) => {
      // step up immediately when needed, then smooth a bit
      const stepUp = Math.max(prev, desired);
      const lerp = 0.18;
      return prev + (stepUp - prev) * lerp;
    });
  }, [isSetup, currentMultiplier]);

  /** ---------------------------
   *  CAMERA: x window (bustabit)
   *  0..10s fixed, then slides
   * --------------------------- */
  const xMin = elapsedTime <= VIEW_SECONDS ? 0 : elapsedTime - VIEW_SECONDS;
  const xMax = elapsedTime <= VIEW_SECONDS ? VIEW_SECONDS : elapsedTime;

  /** ---------------------------
   *  PIN MODE after 10s
   *  Rocket stays fixed at (X_PIN, Y_PIN)
   *  We achieve this by applying a yOffset to the curve/rocket.
   * --------------------------- */
  const pinned = elapsedTime >= VIEW_SECONDS && isActive;

  // compute vertical offset so CURRENT point is at Y_PIN
  const yOffset = useMemo(() => {
    if (!pinned) return 0;
    const yNow = baseYPercent(currentMultiplier, yMax);
    return Y_PIN - yNow;
  }, [pinned, currentMultiplier, yMax]);

  /** ---------------------------
   *  WORLD trail
   * --------------------------- */
  const [worldTrail, setWorldTrail] = useState<WorldPoint[]>([]);
  const lastSampleRef = useRef<{ t: number; m: number } | null>(null);

  useEffect(() => {
    if (isSetup) {
      setWorldTrail([]);
      lastSampleRef.current = null;
    }
  }, [isSetup]);

  useEffect(() => {
    if (!isActive) return;

    const last = lastSampleRef.current;
    const t = elapsedTime;
    const m = currentMultiplier;

    // sample guard (keeps it smooth & light)
    if (last && Math.abs(last.t - t) < 0.04 && Math.abs(last.m - m) < 0.01) return;

    lastSampleRef.current = { t, m };

    setWorldTrail((prev) => {
      const next = [...prev, { t, m }];

      // keep only points in a bit wider than view window (so line doesn't pop)
      const keepFrom = xMin - 2;
      while (next.length > 0 && next[0].t < keepFrom) next.shift();

      // hard cap
      const MAX = 1200;
      if (next.length > MAX) next.splice(0, next.length - MAX);

      return next;
    });
  }, [isActive, elapsedTime, currentMultiplier, xMin]);

  /** ---------------------------
   *  SCREEN trail points
   * --------------------------- */
  const screenTrail = useMemo(() => {
    return worldTrail.map((p) => {
      const x = xFromTime(p.t, xMin, xMax);
      const y = baseYPercent(p.m, yMax) + yOffset;
      return { x, y: clamp(y, 0, 98) };
    });
  }, [worldTrail, xMin, xMax, yMax, yOffset]);

  /** ---------------------------
   *  Rocket position (same mapping!)
   * --------------------------- */
  const rocketPos = useMemo(() => {
    const x = pinned ? X_PIN : xFromTime(elapsedTime, xMin, xMax);
    const y = baseYPercent(currentMultiplier, yMax) + yOffset;
    return { xPercent: x, yPercent: clamp(y, 0, 98) };
  }, [pinned, elapsedTime, xMin, xMax, currentMultiplier, yMax, yOffset]);

  /** Explosion uses same position as rocket */
  const explosionPosition = useMemo(() => {
    return { x: rocketPos.xPercent, y: rocketPos.yPercent };
  }, [rocketPos]);

  const bgIntensity = 1;

  return (
    <div className="relative w-full max-w-lg aspect-[3/4] min-h-[400px] overflow-hidden rounded-2xl border border-purple-500/20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Background intensity={bgIntensity} />
      </div>

      {/* Scale */}
      <div className="absolute inset-0 z-10">
        <MultiplierScale
          currentMultiplier={currentMultiplier}
          targetMultiplier={targetMultiplier}
          state={state}
          yMax={yMax}
          pinned={pinned}
          pinnedYPercent={Y_PIN}
        />
      </div>

      {/* Graph / trail */}
      <div className="absolute inset-0 pointer-events-none z-[19]">
        <svg viewBox="-8 0 108 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={screenTrail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.9"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={screenTrail.map((p) => `${p.x},${100 - p.y}`).join(' ')}
          />
        </svg>
      </div>

      {/* Rocket */}
      <div className="absolute inset-0 z-20">
        <Rocket
          currentMultiplier={currentMultiplier}
          state={state}
          targetMultiplier={targetMultiplier}
          elapsedTime={elapsedTime}
          yMax={yMax}
          positionOverride={rocketPos}
          pinned={pinned}
        />
      </div>

      {/* Explosion */}
      <div className="absolute inset-0 z-30">
        <CrashExplosion state={state} position={explosionPosition} crashPoint={crashPoint ?? undefined} />
      </div>

      {/* Center display */}
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
