'use client';

import { motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-bleed placeholder background (1920x1080) */}
      <div className="absolute inset-0">
        <PlaceholderImage
          alt="Featured wedding hero photograph"
          label="Hero background"
          width={1920}
          height={1080}
          className="h-full w-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/20 to-blush-50/80" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-32 text-center">
        <motion.p
          className="text-xs uppercase tracking-[0.4em] text-gold-500 sm:text-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Wedding Photography &amp; Films
        </motion.p>
        <motion.h1
          className="mt-6 text-display text-ink-900"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          Your love story,
          <br />
          told beautifully.
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-xl text-base text-ink-700 sm:text-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Magicframes captures timeless, cinematic weddings — the quiet glances,
          the joyful tears, and every moment in between.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <a
            href="#gallery"
            className="rounded-full bg-ink-900 px-8 py-3 text-sm uppercase tracking-widest text-blush-50 transition-colors hover:bg-gold-500"
          >
            View Our Work
          </a>
          <a
            href="#contact"
            className="rounded-full border border-ink-900/30 px-8 py-3 text-sm uppercase tracking-widest text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-500"
          >
            Book a Date
          </a>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-xs uppercase tracking-widest text-ink-700/70">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
