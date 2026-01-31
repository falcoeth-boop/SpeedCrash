export const CRASH_CONFIG = {
  // Balance
  startingBalance: 1000,
  defaultBet: 1,
  betOptions: [0.5, 1, 2, 5, 10, 25],
  
  // Target multiplier
  defaultTarget: 2.0,
  minTarget: 1.01,
  maxTarget: 1000,
  targetPresets: [1.5, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000],
  targetStepFine: 0.01,
  targetStepCoarse: 0.1,
  
  // House edge (3%)
  houseEdge: 0.03,
  
  // Multiplier scale labels (logarithmic)
  scaleLabels: [1, 2, 5, 10, 20, 50, 100, 250],
  
  // Animation timing (ms)
  animation: {
    launchCountdown: 1500,    // Pre-launch countdown
    launchIgnition: 500,      // Ignition animation
    explosionDuration: 800,   // Crash explosion
    winCelebration: 1500,     // Win celebration
    resultPause: 1000,        // Pause showing result before next round
    autoPlayDelay: 1500,      // Delay between auto-play rounds
  },
  
  // Curve timing: how long (seconds) until the given multiplier is reached
  // The actual curve is exponential: multiplier = e^(speed * time)
  // speed calibrated so 2x ≈ 3s, 10x ≈ 7s, 100x ≈ 12s
  curveSpeed: 0.23,  // e^(0.23 * t) → t=3 → 2.0x, t=7 → 5.0x, t=10 → 10x, t=14 → 25x
  
  // Auto-play options
  autoPlayOptions: [5, 10, 25, 50],
  
  // History
  maxHistoryLength: 20,
};
