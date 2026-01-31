'use client';

import { useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CRASH_CONFIG } from '@/config/crash-config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  targetMultiplier: number;
  onTargetChange: (n: number) => void;
  betAmount: number;
  onBetChange: (n: number) => void;
  onPlaceBet: () => void;
  isActive: boolean;
  balance: number;
  won: boolean | null;
  lastWinAmount: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clampTarget(value: number): number {
  return Math.round(
    Math.min(CRASH_CONFIG.maxTarget, Math.max(CRASH_CONFIG.minTarget, value)) *
      100
  ) / 100;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Target Multiplier Row                                              */
/* ------------------------------------------------------------------ */

function TargetMultiplierRow({
  target,
  onChange,
  disabled,
}: {
  target: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTarget = useRef(target);
  currentTarget.current = target;

  const stopHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopHold;
  }, [stopHold]);

  const startHold = useCallback(
    (delta: number) => {
      // Immediate fine step
      const next = clampTarget(currentTarget.current + CRASH_CONFIG.targetStepFine * delta);
      onChange(next);
      // After 300ms start coarse repeats
      const timeout = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const coarse = clampTarget(
            currentTarget.current + CRASH_CONFIG.targetStepCoarse * delta
          );
          onChange(coarse);
        }, 80);
      }, 300);
      intervalRef.current = timeout as unknown as ReturnType<typeof setInterval>;
    },
    [onChange]
  );

  const nudge = useCallback(
    (delta: number) => {
      onChange(clampTarget(currentTarget.current + CRASH_CONFIG.targetStepFine * delta));
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      {/* Label + value */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-purple-300/60 uppercase tracking-wider">
          Target Multiplier
        </span>
        <div className="flex items-center gap-2">
          {/* Minus */}
          <button
            disabled={disabled}
            onMouseDown={() => startHold(-1)}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold(-1)}
            onTouchEnd={stopHold}
            onClick={() => nudge(-1)}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 
                       text-white/60 hover:text-white hover:border-purple-500/40
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center text-lg font-bold
                       transition-colors"
          >
            −
          </button>

          {/* Display */}
          <span className="min-w-[5rem] text-center text-xl font-bold text-white tabular-nums">
            {target.toFixed(2)}x
          </span>

          {/* Plus */}
          <button
            disabled={disabled}
            onMouseDown={() => startHold(1)}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold(1)}
            onTouchEnd={stopHold}
            onClick={() => nudge(1)}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 
                       text-white/60 hover:text-white hover:border-purple-500/40
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center text-lg font-bold
                       transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {CRASH_CONFIG.targetPresets.map((preset) => {
          const isSelected = Math.abs(target - preset) < 0.001;
          return (
            <button
              key={preset}
              disabled={disabled}
              onClick={() => onChange(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                ${
                  isSelected
                    ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-800/80 text-white/50 border border-slate-700/50 hover:text-white/80 hover:border-slate-600'
                }
                disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {preset}x
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bet Amount Row                                                     */
/* ------------------------------------------------------------------ */

function BetAmountRow({
  betAmount,
  onChange,
  balance,
  disabled,
  won,
  lastWinAmount,
}: {
  betAmount: number;
  onChange: (n: number) => void;
  balance: number;
  disabled: boolean;
  won: boolean | null;
  lastWinAmount: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-purple-300/60 uppercase tracking-wider">
          Bet Amount
        </span>
        <div className="flex items-center gap-3">
          {/* Balance */}
          <span className="text-xs text-white/40">
            Bal: <span className="text-white/70 font-medium">{formatCurrency(balance)}</span>
          </span>
          {/* Win display */}
          <AnimatePresence>
            {won === true && lastWinAmount > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs font-bold text-green-400"
              >
                +{formatCurrency(lastWinAmount)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bet preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {CRASH_CONFIG.betOptions.map((option) => {
          const isSelected = Math.abs(betAmount - option) < 0.001;
          const cantAfford = option > balance;
          return (
            <button
              key={option}
              disabled={disabled || cantAfford}
              onClick={() => onChange(option)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${
                  isSelected
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                    : 'bg-slate-800/80 text-white/50 border border-slate-700/50 hover:text-white/80 hover:border-slate-600'
                }
                ${cantAfford ? 'opacity-20' : ''}
                disabled:cursor-not-allowed`}
            >
              {formatCurrency(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BET Button                                                         */
/* ------------------------------------------------------------------ */

type ButtonState = 'idle' | 'flying' | 'win' | 'crashed';

function getButtonState(isActive: boolean, won: boolean | null): ButtonState {
  if (won === true) return 'win';
  if (won === false) return 'crashed';
  if (isActive) return 'flying';
  return 'idle';
}

const buttonStyles: Record<ButtonState, string> = {
  idle: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.25)]',
  flying:
    'bg-gradient-to-r from-amber-600 to-amber-500 text-white/80 cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  win: 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]',
  crashed:
    'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]',
};

function BetButton({
  isActive,
  won,
  lastWinAmount,
  onPlaceBet,
  canBet,
}: {
  isActive: boolean;
  won: boolean | null;
  lastWinAmount: number;
  onPlaceBet: () => void;
  canBet: boolean;
}) {
  const state = getButtonState(isActive, won);

  const label = (() => {
    switch (state) {
      case 'flying':
        return 'FLYING...';
      case 'win':
        return `WIN! +${formatCurrency(lastWinAmount)}`;
      case 'crashed':
        return 'CRASHED';
      default:
        return 'BET';
    }
  })();

  const isDisabled = isActive || !canBet;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={state}
        disabled={isDisabled}
        onClick={onPlaceBet}
        className={`w-full py-3.5 rounded-xl text-lg font-black uppercase tracking-wider
          transition-shadow disabled:opacity-60 disabled:cursor-not-allowed
          ${buttonStyles[state]}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      >
        {label}
      </motion.button>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function BetControls({
  targetMultiplier,
  onTargetChange,
  betAmount,
  onBetChange,
  onPlaceBet,
  isActive,
  balance,
  won,
  lastWinAmount,
}: Props) {
  const canBet = balance >= betAmount && !isActive;

  return (
    <div
      className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-purple-500/20
                 p-4 space-y-4"
    >
      {/* Row 1: Target multiplier */}
      <TargetMultiplierRow
        target={targetMultiplier}
        onChange={onTargetChange}
        disabled={isActive}
      />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Row 2: Bet amount */}
      <BetAmountRow
        betAmount={betAmount}
        onChange={onBetChange}
        balance={balance}
        disabled={isActive}
        won={won}
        lastWinAmount={lastWinAmount}
      />

      {/* Row 3: BET button */}
      <BetButton
        isActive={isActive}
        won={won}
        lastWinAmount={lastWinAmount}
        onPlaceBet={onPlaceBet}
        canBet={canBet}
      />
    </div>
  );
}
