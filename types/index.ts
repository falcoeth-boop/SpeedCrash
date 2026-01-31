// Game states
export type CrashState = 'IDLE' | 'BETTING' | 'LAUNCHING' | 'FLYING' | 'CRASHED' | 'WIN';

// Crash round result
export interface CrashResult {
  crashPoint: number;       // The multiplier where it crashes (e.g. 2.45)
  targetMultiplier: number; // Player's pre-committed target
  betAmount: number;
  won: boolean;             // crashPoint >= targetMultiplier
  winAmount: number;        // won ? betAmount * targetMultiplier : 0
  timestamp: number;
}

// Bet history entry (for the scrolling history bar)
export interface BetHistoryEntry {
  id: string;
  crashPoint: number;
  timestamp: number;
}

// Game state managed by the hook
export interface CrashGameState {
  state: CrashState;
  balance: number;
  betAmount: number;
  targetMultiplier: number;
  currentMultiplier: number;   // Live animated value during FLYING
  elapsedTime: number;         // Seconds elapsed during flight (for X-axis positioning)
  crashPoint: number | null;   // Revealed after crash/win
  lastResult: CrashResult | null;
  history: BetHistoryEntry[];  // Last 20 crash points
  autoPlayRemaining: number;   // 0 = not auto-playing
}

// Session statistics
export interface CrashSessionStats {
  totalRounds: number;
  wins: number;
  losses: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestMultiplier: number;
  netPnL: number;
  currentStreak: number;       // Positive = win streak, negative = loss streak
}
