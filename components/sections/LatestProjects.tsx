'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import Reveal from '@/components/Reveal';
import { getDataProvider } from '@/lib/data/provider';
import type { Project } from '@/lib/types';
import SectionStatus, { type LoadState } from '@/components/SectionStatus';

// How many projects the "Latest Projects" section shows at once.
const LATEST_LIMIT = 6;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Sort projects newest-first by their `date`. `date` is a free-form string
 * (ISO like `2024-11-12` or friendly like `June 2024`), so parse defensively
 * and fall back to a string compare when a value isn't a parseable date.
 */
function sortByDateDesc(a: Project, b: Project): number {
  const ta = new Date(a.date).getTime();
  const tb = new Date(b.date).getTime();
  const aValid = !Number.isNaN(ta);
  const bValid = !Number.isNaN(tb);
  if (aValid && bValid) return tb - ta;
  if (aValid) return -1;
  if (bValid) return 1;
  return b.date.localeCompare(a.date);
}

export default function LatestProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let alive = true;
    getDataProvider()
      .listProjects()
      .then((data) => {
        if (!alive) return;
        // Match the section's name on every backend: sort newest-first and
        // cap the count regardless of provider ordering.
        const latest = [...data].sort(sortByDateDesc).slice(0, LATEST_LIMIT);
        setProjects(latest);
        setLoadState('ready');
      })
      .catch(() => {
        if (alive) {
          setProjects([]);
          setLoadState('error');
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="projects" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500">
            Latest Projects
          </p>
          <h2 className="mt-4 font-serif text-4xl text-ink-900 sm:text-5xl">
            Recently celebrated
          </h2>
          <p className="mt-4 text-base text-ink-700">
            A look at the newest weddings we have had the honor to document.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.12} as="article">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-blush-50 shadow-sm ring-1 ring-blush-100"
              >
                <div className="overflow-hidden">
                  <PlaceholderImage
                    src={project.coverSrc}
                    alt={`${project.title} cover`}
                    label={project.title}
                    width={project.coverWidth}
                    height={project.coverHeight}
                    className="w-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="text-xs uppercase tracking-widest text-gold-500">
                    {formatDate(project.date)}
                  </time>
                  <h3 className="mt-2 font-serif text-2xl text-ink-900">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <SectionStatus state={loadState} count={projects.length} noun="projects" />
      </div>
    </section>
  );
}
