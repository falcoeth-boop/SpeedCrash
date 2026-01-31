'use client';

import { CRASH_CONFIG } from '@/config/crash-config';
import { multiplierToYPosition, formatMultiplier } from '@/engine/MultiplierCurve';
import type { CrashState } from '@/types';

interface MultiplierScaleProps {
  currentMultiplier: number;
  targetMultiplier: number;
  state: CrashState;
}

export default function MultiplierScale({
  currentMultiplier,
  targetMultiplier,
  state,
}: MultiplierScaleProps) {
  const isFlying = state === 'FLYING';
  const currentY = multiplierToYPosition(currentMultiplier);
  const targetY = multiplierToYPosition(targetMultiplier);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-16 flex flex-col justify-between pointer-events-none select-none z-10">
      {/* Scale labels */}
      <div className="relative h-full">
        {CRASH_CONFIG.scaleLabels.map((label) => {
          const yPos = multiplierToYPosition(label);
          // yPos is 0 at bottom (1x), 1 at top (250x)
          // CSS top: 0 = top, 100% = bottom, so we invert
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
            left: '-100vw',
            width: '200vw',
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
            {/* Glowing dot */}
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              {/* Horizontal tick line */}
              <div
                className="absolute top-1/2 right-full -translate-y-1/2 h-px bg-emerald-400/40"
                style={{ width: '100vw' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
