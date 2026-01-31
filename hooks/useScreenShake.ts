'use client';

import { useCallback } from 'react';
import { useAnimationControls } from 'framer-motion';

/**
 * Returns Framer Motion animation controls and a trigger function
 * for applying a screen-shake effect to a motion.div.
 *
 * Attach `shakeControls` to the target element:
 *   <motion.div animate={shakeControls}>...</motion.div>
 *
 * Shake intensity scales with the provided magnitude (0-10).
 */
export function useScreenShake() {
  const shakeControls = useAnimationControls();

  const triggerShake = useCallback(
    (magnitude: number = 5) => {
      const intensity = Math.min(magnitude, 10);

      shakeControls.start({
        x: [
          0,
          -intensity,
          intensity,
          -intensity * 0.6,
          intensity * 0.6,
          -intensity * 0.3,
          0,
        ],
        y: [
          0,
          intensity * 0.4,
          -intensity * 0.4,
          intensity * 0.2,
          -intensity * 0.2,
          0,
        ],
        transition: { duration: 0.3, ease: 'easeInOut' },
      });
    },
    [shakeControls],
  );

  return { shakeControls, triggerShake };
}
