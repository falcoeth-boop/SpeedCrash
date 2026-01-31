import { CRASH_CONFIG } from '@/config/crash-config';

/**
 * TEST_MODE: When true, biases crash points toward higher multipliers
 * so you can easily test the rocket at 10x, 50x, 100x+.
 * Set to false for production distribution.
 */
const TEST_MODE = true;

/**
 * Generate a crash point using the standard crash game formula.
 * Uses house edge to ensure long-term profitability.
 * 
 * Distribution properties (with 3% house edge):
 * - ~3% of rounds crash at 1.00x (instant crash)
 * - Median crash ~2.0x
 * - 1% chance of 100x+
 * - Exponential distribution
 */
export function generateCrashPoint(): number {
  if (TEST_MODE) {
    // Test distribution: biased toward high multipliers
    // ~20% chance each: 2-5x, 5-10x, 10-50x, 50-100x, 100-500x
    const bucket = Math.random();
    if (bucket < 0.2) return 2 + Math.random() * 3;
    if (bucket < 0.4) return 5 + Math.random() * 5;
    if (bucket < 0.6) return 10 + Math.random() * 40;
    if (bucket < 0.8) return 50 + Math.random() * 50;
    return 100 + Math.random() * 400;
  }

  const e = Math.random();
  const houseEdge = CRASH_CONFIG.houseEdge;
  
  // Standard crash formula: max(1, floor(100 / (e * 100)) * (1 - houseEdge))
  // Simplified: if e < houseEdge, instant crash at 1.00
  if (e < houseEdge) {
    return 1.0;
  }
  
  // Otherwise, exponential distribution
  const crashPoint = (1 - houseEdge) / (1 - e);
  
  // Round to 2 decimal places, minimum 1.00
  return Math.max(1.0, Math.floor(crashPoint * 100) / 100);
}

/**
 * Determine if the player wins given their target and the crash point.
 */
export function resolveRound(
  crashPoint: number,
  targetMultiplier: number,
  betAmount: number
): { won: boolean; winAmount: number } {
  const won = crashPoint >= targetMultiplier;
  const winAmount = won ? Math.floor(betAmount * targetMultiplier * 100) / 100 : 0;
  return { won, winAmount };
}
