'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrashState } from '@/types';

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

  yMax?: number;

  /** ✅ NEW: RocketScene can override exact screen position (Bustabit camera) */
  positionOverride?: { xPercent: number; yPercent: number };

  /** optional: used only for small visual tweaks */
  pinned?: boolean;

  onPosition?: (pos: RocketPos) => void;
}

const X_START = -8;
const ROTATION_DMULT = 0.05;

/** tweak if needed */
const ROCKET_ANGLE_OFFSET = 45;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** local Y mapping only used for rotation when override exists */
function baseYPercent(multiplier: number, yMax?: number): number {
  const max = Math.max(2, yMax ?? 2);
  const m = clamp(multiplier, 1, max);
  const yNorm = Math.log(m) / Math.log(max);
  return yNorm * 85;
}

/** simple dx in percent space for rotation */
function getRotation(multiplier: number, elapsedTime: number, yMax?: number): number {
  const m0 = Math.max(multiplier, 1);
  const m1 = m0 + ROTATION_DMULT;

  const y0 = baseYPercent(m0, yMax);
  const y1 = baseYPercent(m1, yMax);

  // pseudo dx
  const dx = 1.2;
  const dy = y1 - y0;

  const radians = Math.atan2(dy, dx);
  const degrees = radians * (180 / Math.PI);
  return ROCKET_ANGLE_OFFSET - degrees;
}

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

export function Rocket({
  currentMultiplier,
  state,
  targetMultiplier,
  elapsedTime,
  sprite,
  onPosition,
  yMax,
  positionOverride,
  pinned,
}: Props) {
  const isIdle = state === 'IDLE' || state === 'BETTING';
  const isLaunching = state === 'LAUNCHING';
  const isFlying = state === 'FLYING';
  const isWin = state === 'WIN';
  const isCrashed = state === 'CRASHED';

  const active = isFlying || isWin;

  const { xPercent, yPercent, rotation, showExhaust, showRocket, nearTarget } =
    useMemo(() => {
      const x = positionOverride?.xPercent ?? (active ? 0 : X_START);
      const y = positionOverride?.yPercent ?? (active ? 0 : 0);

      // rotation stays based on curve direction (safe even when pinned)
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
      positionOverride,
      active,
      currentMultiplier,
      elapsedTime,
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
              isLaunching && !pinned
                ? { x: [0, -2, 2, -3, 3, -1, 1, 0], y: [0, 1, -1, 2, -2, 1, 0] }
                : { x: 0, y: 0 }
            }
            transition={
              isLaunching && !pinned
                ? { duration: 0.3, repeat: Infinity, repeatType: 'loop' as const }
                : { duration: 0.1 }
            }
          >
            {(isWin || nearTarget) && (
              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)',
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
