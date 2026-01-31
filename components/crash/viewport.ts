export function getTargetYMax(multiplier: number): number {
  if (multiplier < 2) return 2;
  if (multiplier < 5) return 5;
  if (multiplier < 10) return 10;
  if (multiplier < 20) return 20;
  if (multiplier < 50) return 50;
  if (multiplier < 100) return 100;
  return 250;
}

export function toViewportY(multiplier: number, yMax: number): number {
  const max = Math.max(2, yMax);
  const m = Math.max(1, Math.min(multiplier, max));
  return Math.log(m) / Math.log(max); // 0..1
}

export function toViewportYPercent(multiplier: number, yMax: number, yTop = 85): number {
  return toViewportY(multiplier, yMax) * yTop; // 0..yTop
}
