'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrashState } from '@/types';
import { CRASH_CONFIG } from '@/config/crash-config';
import { useScreenShake } from '@/hooks/useScreenShake';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ParticleData {
  id: string;
  /** Emoji or symbol */
  char: string;
  /** Starting x/y in px relative to center */
  dx: number;
  dy: number;
  /** Rotation end */
  rotate: number;
  /** Scale */
  scale: number;
  /** Delay in seconds */
  delay: number;
  /** Duration in seconds */
  duration: number;
  /** Font size in px */
  fontSize: number;
}

interface Props {
  state: CrashState;
  position: { x: number; y: number };
  crashPoint?: number;
}

/* ------------------------------------------------------------------ */
/*  Particle factories                                                 */
/* ------------------------------------------------------------------ */

const CRASH_CHARS = ['🔥', '🔥', '🔥', '✦', '✦', '💥', '✦', '🔥', '✦', '💥'];
const CRASH_COLORS = [
  'rgba(255, 60, 20, 1)',
  'rgba(255, 140, 0, 1)',
  'rgba(255, 200, 50, 1)',
  'rgba(255, 80, 0, 0.9)',
  'rgba(255, 60, 20, 0.8)',
];

const WIN_CHARS = ['⭐', '✨', '🪙', '✨', '⭐', '✨', '🪙', '⭐', '✨', '✨'];

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateCrashParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + randomRange(-0.3, 0.3);
    const distance = randomRange(40, 120);
    return {
      id: `crash-${i}`,
      char: CRASH_CHARS[i % CRASH_CHARS.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: randomRange(-180, 180),
      scale: randomRange(0.6, 1.4),
      delay: randomRange(0, 0.1),
      duration: randomRange(0.4, 0.8),
      fontSize: randomRange(14, 28),
    };
  });
}

function generateWinParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + randomRange(-0.3, 0.3);
    const distance = randomRange(30, 100);
    return {
      id: `win-${i}`,
      char: WIN_CHARS[i % WIN_CHARS.length],
      dx: Math.cos(angle) * distance * 0.6,
      dy: -Math.abs(Math.sin(angle) * distance) - randomRange(20, 60), // upward drift
      rotate: randomRange(-90, 90),
      scale: randomRange(0.8, 1.5),
      delay: randomRange(0, 0.3),
      duration: randomRange(0.8, 1.4),
      fontSize: randomRange(16, 30),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CrashExplosion({ state, position, crashPoint }: Props) {
  const [crashParticles, setCrashParticles] = useState<ParticleData[]>([]);
  const [winParticles, setWinParticles] = useState<ParticleData[]>([]);
  const { shakeControls, triggerShake } = useScreenShake();

  const isCrashed = state === 'CRASHED';
  const isWin = state === 'WIN';

  // Generate particles on state change
  useEffect(() => {
    if (isCrashed) {
      setCrashParticles(generateCrashParticles(25));
      triggerShake(8);
    } else {
      setCrashParticles([]);
    }
  }, [isCrashed, triggerShake]);

  useEffect(() => {
    if (isWin) {
      setWinParticles(generateWinParticles(20));
    } else {
      setWinParticles([]);
    }
  }, [isWin]);

  // Auto-clear after duration
  useEffect(() => {
    if (isCrashed) {
      const timer = setTimeout(() => {
        setCrashParticles([]);
      }, CRASH_CONFIG.animation.explosionDuration);
      return () => clearTimeout(timer);
    }
  }, [isCrashed]);

  useEffect(() => {
    if (isWin) {
      const timer = setTimeout(() => {
        setWinParticles([]);
      }, CRASH_CONFIG.animation.winCelebration);
      return () => clearTimeout(timer);
    }
  }, [isWin]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none z-40"
      animate={shakeControls}
    >
      {/* Crash explosion */}
      <AnimatePresence>
        {isCrashed && (
          <>
            {/* Central flash */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                width: 80,
                height: 80,
                marginLeft: -40,
                marginBottom: -40,
                background:
                  'radial-gradient(circle, rgba(255,200,50,0.9) 0%, rgba(255,100,0,0.6) 40%, transparent 70%)',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 2.5, 0], opacity: [1, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            {/* Crash particles */}
            {crashParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${position.x}%`,
                  bottom: `${position.y}%`,
                  fontSize: p.fontSize,
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 4px ${CRASH_COLORS[Math.floor(Math.random() * CRASH_COLORS.length)]})`,
                }}
                initial={{ scale: 0, opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={{
                  scale: [0, p.scale, 0],
                  opacity: [1, 0.9, 0],
                  x: p.dx,
                  y: -p.dy, // negate because bottom-based
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              >
                {p.char}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Win celebration */}
      <AnimatePresence>
        {isWin && (
          <>
            {/* Central glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: `${position.x}%`,
                bottom: `${position.y}%`,
                width: 100,
                height: 100,
                marginLeft: -50,
                marginBottom: -50,
                background:
                  'radial-gradient(circle, rgba(34,197,94,0.6) 0%, rgba(250,204,21,0.3) 50%, transparent 70%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 1.5], opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Win particles */}
            {winParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${position.x}%`,
                  bottom: `${position.y}%`,
                  fontSize: p.fontSize,
                  lineHeight: 1,
                  filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.8))',
                }}
                initial={{ scale: 0, opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={{
                  scale: [0, p.scale, p.scale * 0.5],
                  opacity: [0, 1, 0],
                  x: p.dx,
                  y: -p.dy,
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              >
                {p.char}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
