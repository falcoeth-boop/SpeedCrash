'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CrashState } from '@/types';
import { formatMultiplier } from '@/engine/MultiplierCurve';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  currentMultiplier: number;
  targetMultiplier: number;
  state: CrashState;
  crashPoint?: number;
}

/* ------------------------------------------------------------------ */
/*  Sub-components for each state                                      */
/* ------------------------------------------------------------------ */

function IdleDisplay() {
  return (
    <motion.div
      key="idle"
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-2xl font-bold text-white/30 tracking-wider uppercase">
        Set Target
      </p>
    </motion.div>
  );
}

function BettingDisplay({ targetMultiplier }: { targetMultiplier: number }) {
  return (
    <motion.div
      key="betting"
      className="text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-lg font-medium text-white/50 uppercase tracking-wider mb-1">
        Target
      </p>
      <p className="text-4xl font-bold text-amber-400">
        {formatMultiplier(targetMultiplier)}
      </p>
    </motion.div>
  );
}

function LaunchingDisplay() {
  return (
    <motion.div
      key="launching"
      className="text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.3 }}
    >
      <motion.p
        className="text-3xl font-bold text-amber-400 uppercase tracking-widest"
        animate={{
          opacity: [1, 0.5, 1],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        Launching...
      </motion.p>
    </motion.div>
  );
}

function FlyingDisplay({
  currentMultiplier,
  targetMultiplier,
}: {
  currentMultiplier: number;
  targetMultiplier: number;
}) {
  const approaching = targetMultiplier > 1 && currentMultiplier >= targetMultiplier * 0.8;
  const textColor = approaching ? 'text-green-400' : 'text-white';

  return (
    <motion.div
      key="flying"
      className="text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <motion.p
        className={`text-6xl sm:text-7xl font-black tabular-nums ${textColor}`}
        style={{
          textShadow: approaching
            ? '0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)'
            : '0 0 10px rgba(255,255,255,0.2)',
        }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {formatMultiplier(currentMultiplier)}
      </motion.p>
      <p className="text-sm text-white/40 mt-2">
        Target: {formatMultiplier(targetMultiplier)}
      </p>
    </motion.div>
  );
}

function WinDisplay({
  currentMultiplier,
  targetMultiplier,
}: {
  currentMultiplier: number;
  targetMultiplier: number;
}) {
  return (
    <motion.div
      key="win"
      className="text-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      <motion.p
        className="text-5xl sm:text-6xl font-black text-green-400"
        style={{
          textShadow:
            '0 0 20px rgba(34,197,94,0.7), 0 0 40px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.2)',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        WIN!
      </motion.p>
      <p className="text-3xl font-bold text-green-300 mt-2">
        {formatMultiplier(targetMultiplier)}
      </p>
    </motion.div>
  );
}

function CrashedDisplay({ crashPoint }: { crashPoint?: number }) {
  return (
    <motion.div
      key="crashed"
      className="text-center"
      initial={{ opacity: 0, scale: 1.3 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{
          x: [0, -4, 4, -3, 3, -1, 0],
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <p
          className="text-5xl sm:text-6xl font-black text-red-500"
          style={{
            textShadow:
              '0 0 20px rgba(239,68,68,0.7), 0 0 40px rgba(239,68,68,0.4)',
          }}
        >
          CRASHED
        </p>
        {crashPoint != null && (
          <p className="text-3xl font-bold text-red-400 mt-2">
            {formatMultiplier(crashPoint)}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function MultiplierDisplay({
  currentMultiplier,
  targetMultiplier,
  state,
  crashPoint,
}: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <AnimatePresence mode="wait">
        {state === 'IDLE' && <IdleDisplay />}
        {state === 'BETTING' && (
          <BettingDisplay targetMultiplier={targetMultiplier} />
        )}
        {state === 'LAUNCHING' && <LaunchingDisplay />}
        {state === 'FLYING' && (
          <FlyingDisplay
            currentMultiplier={currentMultiplier}
            targetMultiplier={targetMultiplier}
          />
        )}
        {state === 'WIN' && (
          <WinDisplay
            currentMultiplier={currentMultiplier}
            targetMultiplier={targetMultiplier}
          />
        )}
        {state === 'CRASHED' && <CrashedDisplay crashPoint={crashPoint} />}
      </AnimatePresence>
    </div>
  );
}
