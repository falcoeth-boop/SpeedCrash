'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrashState } from '@/types';
import { multiplierToYPosition } from '@/engine/MultiplierCurve';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SpriteConfig {
  src: string;
  width: number;
  height: number;
}

interface Props {
  currentMultiplier: number;
  state: CrashState;
  targetMultiplier: number;
  elapsedTime: number;
  sprite?: SpriteConfig;
}

/* ------------------------------------------------------------------ */
/*  Position & Rotation Helpers                                        */
/* ------------------------------------------------------------------ */

/**
 * X position: maps elapsed time to horizontal progress.
 * ~10s to cross the full scene width.
 * Starts at -8% (off-screen left).
 */
function getX(elapsedTime: number): number {
  if (elapsedTime <= 0) return -8;
  const timeScale = 10;
  return Math.min(92, (elapsedTime / timeScale) * 92);
}

/**
 * Y position: maps multiplier to vertical position.
 * 1x = 0% (very bottom), max = ~85% (top).
 * Uses the log scale from MultiplierCurve.
 */
function getY(multiplier: number): number {
  const yNorm = multiplierToYPosition(multiplier); // 0 at 1x, 1 at 250x
  return yNorm * 85; // 0% at bottom, 85% at top
}

/**
 * Rotation: follows the curve tangent.
 * 
 * At 1x the curve is flat → 0° (horizontal).
 * As multiplier grows, the exponential steepens → rotation increases.
 * 
 * We compute this from the mathematical derivative rather than
 * discrete frame deltas, so it's smooth and starts at exactly 0°.
 * 
 * On the log Y scale, dy/dt is constant (the exponential becomes linear).
 * But visually we want the rocket to FEEL like it starts flat and curves up.
 * So we use the raw multiplier growth rate vs X progression rate,
 * with a perceptual mapping that starts at 0° and climbs smoothly.
 */
function getRotation(multiplier: number): number {
  // How far above 1x we are — at 1x this is 0, grows with flight
  const excess = multiplier - 1;
  
  // atan gives 0° at excess=0, ~45° when excess=3, ~72° when excess=9
  // The divisor (3) controls how fast it tilts — higher = gentler curve
  const radians = Math.atan2(excess, 3);
  const degrees = radians * (180 / Math.PI);
  
  // The 🚀 emoji naturally points ~45° up-right.
  // Offset by +45° so at 0° curve angle the rocket appears horizontal.
  // As curve steepens, subtract degrees to tilt nose upward.
  return 45 - degrees;
}

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Rocket({ currentMultiplier, state, targetMultiplier, elapsedTime, sprite }: Props) {
  const isIdle = state === 'IDLE' || state === 'BETTING';
  const isLaunching = state === 'LAUNCHING';
  const isFlying = state === 'FLYING';
  const isWin = state === 'WIN';
  const isCrashed = state === 'CRASHED';

  // Position on the curve
  const active = isFlying || isWin;
  const xPercent = active ? getX(elapsedTime) : -8;
  const yPercent = active ? getY(currentMultiplier) : 0;
  const rotation = active ? getRotation(currentMultiplier) : 0;

  const showExhaust = isLaunching || isFlying || isWin;
  const showRocket = !isCrashed && !isIdle;

  // Near target → green glow
  const nearTarget =
    isFlying && targetMultiplier > 1 && currentMultiplier >= targetMultiplier * 0.8;

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
          {/* Shake wrapper for LAUNCHING */}
          <motion.div
            animate={
              isLaunching
                ? {
                    x: [0, -2, 2, -3, 3, -1, 1, 0],
                    y: [0, 1, -1, 2, -2, 1, 0],
                  }
                : { x: 0, y: 0 }
            }
            transition={
              isLaunching
                ? { duration: 0.3, repeat: Infinity, repeatType: 'loop' as const }
                : { duration: 0.1 }
            }
          >
            {/* Win / near-target glow */}
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

            {/* Rocket visual */}
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

            {/* Exhaust trail particles */}
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
                        // Trail goes behind the rocket (leftward)
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
