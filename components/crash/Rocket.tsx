'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrashState } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SpriteConfig {
  src: string;
  width: number;
  height: number;
}

type RocketPos = {
  xPercent: number;
  yPercent: number;
  multiplier: number;
};

interface Props {
  currentMultiplier: number;
  state: CrashState;
  targetMultiplier: number;
  elapsedTime: number;
  sprite?: SpriteConfig;

  /** ✅ NEW: makes Rocket match bustabit viewport */
  yMax?: number;

  /** Optional: lets RocketScene sample the path for star-trail rendering */
  onPosition?: (pos: RocketPos) => void;
}

/* ------------------------------------------------------------------ */
/*  Tuning                                                             */
/* ------------------------------------------------------------------ */

const TIME_TO_CROSS_SCENE = 10;
const X_START = -8;
const X_END = 92;

const ROTATION_DMULT = 0.05;
const Y_TOP = 85;

/* ------------------------------------------------------------------ */
/*  Exhaust trail colors                                               */
/* ------------------------------------------------------------------ */

const TRAIL_COLORS = [
  'rgba(255, 220, 80, 1)',
  'rgba(255, 180, 40, 0.9)',
  'rgba(255, 140, 20, 0.8)',
  'rgba(255, 100, 10, 0.7)',
  'rgba(255, 70, 0, 0.6)',
  'rgba(240, 50, 0, 0.5)',
  'rgba(220, 30, 0, 0.4)',
  'rgba(200, 20, 0, 0.3)',
  'rgba(180, 10, 0, 0.25)',
  'rgba(160, 5, 0, 0.2)',
  'rgba(140, 0, 0, 0.15)',
  'rgba(120, 0, 0, 0.1)',
];

const TRAIL_COUNT = 12;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** X maps elapsed time to horizontal progress FROM X_START → X_END */
function getX(elapsedTime: number): number {
  if (elapsedTime <= 0) return X_START;
  const progress = elapsedTime / TIME_TO_CROSS_SCENE; // 0..1
  const x = X_START + progress * (X_END - X_START);
  return Math.min(X_END, x);
}

/** ✅ Bustabit viewport Y mapping: 1..yMax => 0..Y_TOP */
function getY(multiplier: number, yMax?: number): number {
  const max = Math.max(2, yMax ?? 250);
  const m = clamp(multiplier, 1, max);
  const yNorm = Math.log(m) / Math.log(max);
  return yNorm * Y_TOP;
}

function getRotation(multiplier: number, elapsedTime: number, yMax?: number): number {
  const m0 = Math.max(multiplier, 1);
  const m1 = m0 + ROTATION_DMULT;

  const y0 = getY(m0, yMax);
  const y1 = getY(m1, yMax);

  const x0 = getX(elapsedTime);
  const x1 = getX(elapsedTime + 0.05);

  const dy = y1 - y0;
  const dx = Math.max(0.0001, x1 - x0);

  const radians = Math.atan2(dy, dx);
  const degrees = radians * (180 / Math.PI);

  return 45 - degrees;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Rocket({
  currentMultiplier,
  state,
  targetMultiplier,
  elapsedTime,
  sprite,
  onPosition,
  yMax,
}: Props) {
  const isIdle = state === 'IDLE' || state === 'BETTING';
  const isLaunching = state === 'LAUNCHING';
  const isFlying = state === 'FLYING';
  const isWin = state === 'WIN';
  const isCrashed = state === 'CRASHED';

  const active = isFlying || isWin;

  const { xPercent, yPercent, rotation, showExhaust, showRocket, nearTarget } =
    useMemo(() => {
      const x = active ? getX(elapsedTime) : X_START;
      const y = active ? getY(currentMultiplier, yMax) : 0;
      const rot = active ? getRotation(currentMultiplier, elapsedTime, yMax) : 0;

      const exhaust = isLaunching || isFlying || isWin;
      const rocketVisible = !isCrashed && !isIdle;

      const near =
        isFlying && targetMultiplier > 1 && currentMultiplier >= targetMultiplier * 0.8;

      return {
        xPercent: x,
        yPercent: y,
        rotation: rot,
        showExhaust: exhaust,
        showRocket: rocketVisible,
        nearTarget: near,
      };
    }, [
      active,
      elapsedTime,
      currentMultiplier,
      yMax,
      isLaunching,
      isFlying,
      isWin,
      isCrashed,
      isIdle,
      targetMultiplier,
    ]);

  useEffect(() => {
    if (!onPosition) return;
    if (!active) return;
    onPosition({ xPercent, yPercent, multiplier: currentMultiplier });
  }, [onPosition, active, xPercent, yPercent, currentMultiplier]);

  return (
    <AnimatePresence>
      {showRocket && (
        <motion.div
          className="absolute pointer-events-none z-30"
          style={{
            left: `${xPercent}%`,
            bottom: `${yPercent}%`,
            transform: `rotate(${rotation}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isLaunching ? 0.7 : 1,
            scale: isWin ? 1.15 : 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.3,
            transition: { duration: 0.15 },
          }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { duration: 0.2 },
          }}
        >
          <motion.div
            animate={
              isLaunching
                ? { x: [0, -2, 2, -3, 3, -1, 1, 0], y: [0, 1, -1, 2, -2, 1, 0] }
                : { x: 0, y: 0 }
            }
            transition={
              isLaunching
                ? { duration: 0.3, repeat: Infinity, repeatType: 'loop' as const }
                : { duration: 0.1 }
            }
          >
            {(isWin || nearTarget) && (
              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}

            <div className="relative" style={{ width: 48, height: 48 }}>
              {sprite ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sprite.src}
                  alt="rocket"
                  width={sprite.width}
                  height={sprite.height}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span
                  className="text-4xl select-none block"
                  role="img"
                  aria-label="rocket"
                  style={{ filter: isWin ? 'drop-shadow(0 0 8px #22c55e)' : undefined }}
                >
                  🚀
                </span>
              )}
            </div>

            <AnimatePresence>
              {showExhaust &&
                Array.from({ length: TRAIL_COUNT }, (_, i) => {
                  const t = i / TRAIL_COUNT;
                  const size = 14 - i * 1;
                  const opacity = 1 - t * 0.8;
                  const color = TRAIL_COLORS[i] ?? TRAIL_COLORS[TRAIL_COLORS.length - 1];

                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: size,
                        height: size,
                        left: 24 - 8 - i * 5,
                        top: 24 + i * 2,
                        background: `radial-gradient(circle, ${color}, transparent)`,
                        boxShadow: `0 0 ${size}px ${size / 3}px ${color}`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [opacity, opacity * 0.5, 0],
                        scale: [0.6, 1, 0.2],
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        duration: 0.6 + i * 0.05,
                        repeat: Infinity,
                        repeatType: 'loop',
                        delay: i * 0.03,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
