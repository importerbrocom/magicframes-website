'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import Reveal from '@/components/Reveal';
import { getDataProvider } from '@/lib/data/provider';
import type { GalleryImage } from '@/lib/types';
import SectionStatus, { type LoadState } from '@/components/SectionStatus';

export default function ImageGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [active, setActive] = useState<GalleryImage | null>(null);

  useEffect(() => {
    let alive = true;
    getDataProvider()
      .listImages()
      .then((data) => {
        if (alive) {
          setImages(data);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (alive) {
          setImages([]);
          setLoadState('error');
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Close lightbox on Escape.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <section id="gallery" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500">
            Photo Gallery
          </p>
          <h2 className="mt-4 font-serif text-4xl text-ink-900 sm:text-5xl">
            Moments worth keeping
          </h2>
          <p className="mt-4 text-base text-ink-700">
            A glimpse of the frames we live for. Tap any image to view it larger.
          </p>
        </Reveal>

        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3 [column-fill:_balance]">
          {images.map((img, i) => (
            <Reveal
              key={img.id}
              delay={(i % 3) * 0.08}
              className="mb-5 break-inside-avoid"
            >
              <motion.button
                type="button"
                onClick={() => setActive(img)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group block w-full overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-blush-100"
                aria-label={`Open ${img.title}`}
              >
                <div className="relative">
                  <PlaceholderImage
                    src={img.src}
                    alt={img.alt}
                    label={img.title}
                    width={img.width}
                    height={img.height}
                    className="w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-ink-900/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="p-4 font-serif text-lg text-blush-50">
                      {img.title}
                    </span>
                  </div>
                </div>
              </motion.button>
            </Reveal>
          ))}
        </div>

        <SectionStatus state={loadState} count={images.length} noun="photos" />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/80 p-6 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div
              className="relative w-full max-w-4xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setActive(null)}
                className="absolute -top-12 right-0 text-sm uppercase tracking-widest text-blush-50 hover:text-gold-500"
              >
                Close ✕
              </button>
              <PlaceholderImage
                src={active.src}
                alt={active.alt}
                label={active.title}
                width={active.width}
                height={active.height}
                className="w-full rounded-2xl"
              />
              <p className="mt-4 text-center font-serif text-xl text-blush-50">
                {active.title}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
