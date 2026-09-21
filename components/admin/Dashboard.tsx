'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isSupabaseConfigured } from '@/lib/data/provider';
import ImagesManager from './ImagesManager';
import VideosManager from './VideosManager';
import ProjectsManager from './ProjectsManager';

type Tab = 'images' | 'videos' | 'projects';

const TABS: { id: Tab; label: string }[] = [
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'projects', label: 'Projects' },
];

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('images');
  const usingSupabase = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-blush-50">
      <header className="border-b border-blush-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="font-serif text-xl text-ink-900">MagicFrames Admin</p>
            <p className="text-xs uppercase tracking-widest text-ink-700/50">
              {usingSupabase ? 'Connected to Supabase' : 'Local fallback (this browser only)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-blush-200 px-4 py-2 text-xs uppercase tracking-widest text-ink-700 transition-colors hover:border-gold-400 hover:text-ink-900"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-8 flex gap-2 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-blush-100 sm:inline-flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="relative rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              {tab === t.id ? (
                <motion.span
                  layoutId="admin-tab"
                  className="absolute inset-0 rounded-full bg-ink-900"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span
                className={`relative z-10 ${
                  tab === t.id ? 'text-blush-50' : 'text-ink-700'
                }`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {tab === 'images' ? <ImagesManager /> : null}
            {tab === 'videos' ? <VideosManager /> : null}
            {tab === 'projects' ? <ProjectsManager /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
