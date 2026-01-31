'use client';

import { CRASH_CONFIG } from '@/config/crash-config';
import { multiplierToYPosition, formatMultiplier } from '@/engine/MultiplierCurve';
import type { CrashState } from '@/types';

interface MultiplierScaleProps {
  currentMultiplier: number;
  targetMultiplier: number;
  state: CrashState;
}

const Y_MIN_MULTIPLIER = 2;

// clamp helper
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Remap multiplierToYPosition() so the visible scale starts at 2x (bottom).
 * - 2x -> 0
 * - 250x -> 1
 */
function toDisplayY(multiplier: number) {
  const yMin = multiplierToYPosition(Y_MIN_MULTIPLIER);
  const yRaw = multiplierToYPosition(Math.max(multiplier, Y_MIN_MULTIPLIER));
  const y = (yRaw - yMin) / (1 - yMin);
  return clamp(y, 0, 1);
}

export default function MultiplierScale({
  currentMultiplier,
  targetMultiplier,
  state,
}: MultiplierScaleProps) {
  const isFlying = state === 'FLYING';

  const currentY = toDisplayY(currentMultiplier);
  const targetY = toDisplayY(targetMultiplier);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-16 flex flex-col justify-between pointer-events-none select-none z-10">
      <div className="relative h-full">
        {/* Scale labels (>= 2x only) */}
        {CRASH_CONFIG.scaleLabels
          .filter((label) => label >= Y_MIN_MULTIPLIER)
          .map((label) => {
            const yPos = toDisplayY(label);
            const topPercent = (1 - yPos) * 100;

            return (
              <div
                key={label}
                className="absolute right-2 -translate-y-1/2"
                style={{ top: `${topPercent}%` }}
              >
                <span className="text-xs font-mono text-emerald-400/60">
                  {label}x
                </span>
              </div>
            );
          })}

        {/* Target multiplier: dashed line across full width */}
        <div
          className="absolute right-0 -translate-y-1/2 transition-all duration-300"
          style={{
            top: `${(1 - targetY) * 100}%`,
            left: 0,
            right: 0,
          }}
        >
          <div className="border-t-2 border-dashed border-amber-400/50" />
          <span className="absolute right-2 top-1 text-xs font-mono text-amber-400/80 whitespace-nowrap">
            {formatMultiplier(targetMultiplier)}
          </span>
        </div>

        {/* Current multiplier indicator */}
        {isFlying && (
          <div
            className="absolute right-1 -translate-y-1/2 transition-all duration-75"
            style={{ top: `${(1 - currentY) * 100}%` }}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />

              {/* Horizontal tick line (local to scene, not vw) */}
              <div className="absolute top-1/2 right-full -translate-y-1/2 h-px bg-emerald-400/40"
                   style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
