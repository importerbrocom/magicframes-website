'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the reveal begins. */
  delay?: number;
  /** Distance in pixels the element travels while fading in. */
  y?: number;
  className?: string;
  /** Render as a different element when needed for semantics. */
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Scroll-triggered reveal wrapper. Fades and slides its children up into view
 * the first time they enter the viewport. Used across the public sections to
 * give the site a cohesive, tasteful motion language.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = 'div',
}: RevealProps) {
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
