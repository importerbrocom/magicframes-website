'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import Reveal from '@/components/Reveal';
import { getDataProvider } from '@/lib/data/provider';
import { parseVimeoId } from '@/lib/video';
import type { GalleryVideo } from '@/lib/types';

function embedUrl(video: GalleryVideo): string {
  if (video.provider === 'youtube') {
    return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;
  }
  // Preserve the privacy hash for unlisted Vimeo videos (`<id>:<hash>`).
  const { id, hash } = parseVimeoId(video.videoId);
  const params = new URLSearchParams({ autoplay: '1' });
  if (hash) params.set('h', hash);
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

function VideoCard({ video, delay }: { video: GalleryVideo; delay: number }) {
  const [playing, setPlaying] = useState(false);

  return (
    <Reveal delay={delay} className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-blush-100">
      <div
        className="relative"
        style={{ aspectRatio: `${video.thumbnailWidth} / ${video.thumbnailHeight}` }}
      >
        {playing ? (
          <iframe
            src={embedUrl(video)}
            title={video.title}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <motion.button
            type="button"
            onClick={() => setPlaying(true)}
            whileHover={{ scale: 1.01 }}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play ${video.title}`}
          >
            {/* Placeholder thumbnail (e.g. 1280x720) shown before play */}
            <PlaceholderImage
              alt={`${video.title} video thumbnail`}
              label={video.title}
              width={video.thumbnailWidth}
              height={video.thumbnailHeight}
              className="h-full w-full"
            />
            <span className="absolute inset-0 bg-ink-900/20 transition-colors group-hover:bg-ink-900/30" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush-50/90 shadow-lg transition-transform group-hover:scale-110">
              <span className="ml-1 h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-ink-900" />
            </span>
          </motion.button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="font-serif text-lg text-ink-900">{video.title}</p>
        <span className="text-xs uppercase tracking-widest text-gold-500">
          {video.provider}
        </span>
      </div>
    </Reveal>
  );
}

export default function VideoGallery() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);

  useEffect(() => {
    let alive = true;
    getDataProvider()
      .listVideos()
      .then((data) => {
        if (alive) setVideos(data);
      })
      .catch(() => {
        if (alive) setVideos([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="films" className="bg-blush-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500">
            Wedding Films
          </p>
          <h2 className="mt-4 font-serif text-4xl text-ink-900 sm:text-5xl">
            Stories in motion
          </h2>
          <p className="mt-4 text-base text-ink-700">
            Cinematic highlight reels and full films. Press play to watch.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, i) => (
            <VideoCard key={video.id} video={video} delay={(i % 3) * 0.08} />
          ))}
        </div>

        {videos.length === 0 && (
          <p className="mt-10 text-center text-sm text-ink-700/60">
            Films will appear here once added from the dashboard.
          </p>
        )}
      </div>
    </section>
  );
}
