import { CRASH_CONFIG } from '@/config/crash-config';

/**
 * Convert elapsed time (seconds) to current multiplier value.
 * Uses exponential growth: multiplier = e^(speed * time)
 */
export function timeToMultiplier(elapsedSeconds: number): number {
  const multiplier = Math.exp(CRASH_CONFIG.curveSpeed * elapsedSeconds);
  return Math.floor(multiplier * 100) / 100; // 2 decimal places
}

/**
 * Convert a target multiplier to the time (seconds) it takes to reach it.
 * Inverse: time = ln(multiplier) / speed
 */
export function multiplierToTime(multiplier: number): number {
  if (multiplier <= 1) return 0;
  return Math.log(multiplier) / CRASH_CONFIG.curveSpeed;
}

/**
 * Get the Y-position (0-1 normalized) for a multiplier on a logarithmic scale.
 * Maps 1x → BASE_Y (above the mountain silhouette), 250x → 1.0 (top).
 * The BASE_Y offset ensures the 1x label and rocket starting position
 * are visible above the background artwork.
 */
const BASE_Y = 0.12; // 12% from bottom — clears the mountain silhouette

export function multiplierToYPosition(multiplier: number): number {
  const minLog = Math.log(1);    // 0
  const maxLog = Math.log(250);  // ~5.52
  const currentLog = Math.log(Math.max(1, multiplier));
  const logNorm = Math.min(1, Math.max(0, (currentLog - minLog) / (maxLog - minLog)));
  // Map 0-1 → BASE_Y to 1.0
  return BASE_Y + logNorm * (1 - BASE_Y);
}

/**
 * Format multiplier for display (e.g., "2.45x")
 */
export function formatMultiplier(multiplier: number): string {
  if (multiplier >= 100) return `${multiplier.toFixed(0)}x`;
  if (multiplier >= 10) return `${multiplier.toFixed(1)}x`;
  return `${multiplier.toFixed(2)}x`;
}
