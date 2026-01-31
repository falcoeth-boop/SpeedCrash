import { CrashResult, BetHistoryEntry } from '@/types';
import { generateCrashPoint, resolveRound } from './CrashEngine';

let roundCounter = 0;

/**
 * Dummy crash resolver — generates a random crash point and resolves the bet.
 * In production, this would call a blockchain contract or backend API.
 */
export async function resolveCrash(
  targetMultiplier: number,
  betAmount: number
): Promise<CrashResult> {
  // Simulate slight network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const crashPoint = generateCrashPoint();
  const { won, winAmount } = resolveRound(crashPoint, targetMultiplier, betAmount);
  
  return {
    crashPoint,
    targetMultiplier,
    betAmount,
    won,
    winAmount,
    timestamp: Date.now(),
  };
}

/**
 * Create a history entry from a crash result.
 */
export function resultToHistoryEntry(result: CrashResult): BetHistoryEntry {
  return {
    id: `round-${++roundCounter}`,
    crashPoint: result.crashPoint,
    timestamp: result.timestamp,
  };
}
