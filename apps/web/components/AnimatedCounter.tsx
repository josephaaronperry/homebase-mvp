'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function AnimatedCounter({
  value,
  duration = 1.8,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [mounted, value, duration]);

  return (
    <motion.span
      className={className}
      initial={false}
    >
      {mounted ? display.toLocaleString() : '0'}
    </motion.span>
  );
}
