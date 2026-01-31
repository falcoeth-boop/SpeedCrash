'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  intensity?: number; // 0-1 for parallax/glow intensity
}

// Deterministic pseudo-random number generator (avoids hydration mismatch)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  opacity: number;
  color: string;
  duration: number; // twinkle animation duration
  delay: number; // twinkle animation delay
}

function generateStars(count: number): Star[] {
  const rand = seededRandom(42);
  const colors = ['#ffffff', '#ffffff', '#e0e7ff', '#c7d2fe', '#bfdbfe', '#dbeafe'];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 2, // 1-3px
    opacity: 0.4 + rand() * 0.6,
    color: colors[Math.floor(rand() * colors.length)],
    duration: 2 + rand() * 4, // 2-6s twinkle cycle
    delay: rand() * 5,
  }));
}

export default function Background({ intensity = 1 }: BackgroundProps) {
  const stars = useMemo(() => generateStars(50), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layer 1: Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #020617 0%, #1e1b4b 40%, #3b0764 100%)',
        }}
      />

      {/* Layer 2: Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
            }}
            animate={{
              opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Layer 3: Planet (upper-left) */}
      <div
        className="absolute"
        style={{
          top: '-40px',
          left: '-30px',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #334155 0%, #1e293b 50%, #0f172a 100%)',
          opacity: 0.35 * intensity,
          boxShadow: '0 0 60px 20px rgba(100, 116, 139, 0.15)',
        }}
      />

      {/* Layer 5: Horizon glow (behind mountains) */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background:
            'linear-gradient(to top, transparent 0%, rgba(34, 211, 238, 0.06) 40%, rgba(56, 189, 248, 0.03) 70%, transparent 100%)',
          opacity: intensity,
        }}
      />

      {/* Layer 4: Mountain silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        style={{ height: '18%' }}
      >
        <defs>
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f0a1e" />
          </linearGradient>
        </defs>
        {/* Back mountain range (lighter, further) */}
        <path
          d="M0,200 L0,140 L80,90 L150,120 L220,70 L300,100 L380,55 L460,95 L540,45 L620,85 L700,50 L780,90 L860,60 L940,80 L1020,40 L1100,75 L1200,55 L1200,200 Z"
          fill="url(#mountainGrad)"
          opacity="0.6"
        />
        {/* Front mountain range (darker, closer) */}
        <path
          d="M0,200 L0,155 L60,130 L120,150 L200,110 L280,140 L360,100 L440,135 L520,90 L600,125 L680,95 L760,130 L840,105 L920,135 L1000,115 L1080,140 L1160,120 L1200,130 L1200,200 Z"
          fill="#0c0515"
        />
      </svg>

      {/* Horizon glow line at mountain peaks */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '18%',
          background:
            'linear-gradient(to top, transparent 60%, rgba(34, 211, 238, 0.08) 85%, rgba(56, 189, 248, 0.04) 95%, transparent 100%)',
          opacity: intensity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
