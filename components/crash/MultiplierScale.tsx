'use client';

import { formatMultiplier } from '@/engine/MultiplierCurve';
import type { CrashState } from '@/types';

interface MultiplierScaleProps {
  currentMultiplier: number;
  targetMultiplier: number;
  state: CrashState;
  yMax?: number;

  /** ✅ new: when rocket is pinned, keep dot pinned too */
  pinned?: boolean;
  pinnedYPercent?: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function toDisplayY(multiplier: number, yMax: number) {
  const max = Math.max(2, yMax);
  const m = clamp(multiplier, 1, max);
  const y = Math.log(m) / Math.log(max);
  return clamp(y, 0, 1);
}

function getDynamicLabels(yMax: number): number[] {
  if (yMax <= 2) return [1.2, 1.4, 1.6, 1.8, 2];
  if (yMax <= 5) return [2, 3, 4, 5];
  if (yMax <= 10) return [2, 3, 4, 5, 10];
  if (yMax <= 20) return [5, 10, 15, 20];
  if (yMax <= 50) return [10, 20, 30, 50];
  if (yMax <= 100) return [20, 50, 100];
  return [50, 100, 250];
}

export default function MultiplierScale({
  currentMultiplier,
  targetMultiplier,
  state,
  yMax,
  pinned,
  pinnedYPercent,
}: MultiplierScaleProps) {
  const isFlying = state === 'FLYING' || state === 'LAUNCHING' || state === 'WIN';

  const max = yMax ?? 2;
  const labels = getDynamicLabels(max);

  const currentY = toDisplayY(currentMultiplier, max);
  const targetY = toDisplayY(targetMultiplier, max);

  const currentTopPercent = pinned
    ? clamp(100 - (pinnedYPercent ?? 68), 2, 98)
    : (1 - currentY) * 100;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-16 flex flex-col justify-between pointer-events-none select-none z-10">
      <div className="relative h-full">
        {labels.map((label) => {
          const yPos = toDisplayY(label, max);
          const topPercent = (1 - yPos) * 100;

          return (
            <div
              key={label}
              className="absolute right-2 -translate-y-1/2"
              style={{ top: `${topPercent}%` }}
            >
              <span className="text-xs font-mono text-emerald-400/60">{label}x</span>
            </div>
          );
        })}

        {/* target line */}
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

        {/* current indicator */}
        {isFlying && (
          <div
            className="absolute right-1 -translate-y-1/2 transition-all duration-75"
            style={{ top: `${currentTopPercent}%` }}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              <div
                className="absolute top-1/2 right-full -translate-y-1/2 h-px bg-emerald-400/40"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
