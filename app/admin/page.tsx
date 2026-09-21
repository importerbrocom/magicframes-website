'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Dashboard from '@/components/admin/Dashboard';
import { isSupabaseConfigured } from '@/lib/data/provider';
import { isAuthenticated, login, logout } from '@/lib/auth';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setUsingSupabase(isSupabaseConfigured());
    setReady(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(password, email);
    if (result.ok) {
      setAuthed(true);
      setPassword('');
    } else {
      setError(result.error ?? 'Login failed.');
    }
    setBusy(false);
  }

  function handleLogout() {
    logout();
    setAuthed(false);
  }

  // Avoid a flash of the login form before we can read sessionStorage.
  if (!ready) {
    return <div className="min-h-screen bg-blush-50" />;
  }

  if (authed) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush-100 via-blush-50 to-gold-100 px-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-blush-100 backdrop-blur sm:p-10"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs uppercase tracking-[0.4em] text-gold-500"
        >
          MagicFrames
        </motion.p>
        <h1 className="mt-3 font-serif text-4xl text-ink-900">Admin access</h1>
        <p className="mt-3 text-sm text-ink-700/70">
          Enter your {usingSupabase ? 'Supabase credentials' : 'password'} to manage the
          galleries and projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {usingSupabase ? (
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs uppercase tracking-widest text-ink-700/70"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-400"
                placeholder="admin@magicframes.studio"
              />
            </div>
          ) : null}
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs uppercase tracking-widest text-ink-700/70"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-400"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-blush-500"
            >
              {error}
            </motion.p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ink-900 px-8 py-3 text-sm uppercase tracking-widest text-blush-50 transition-colors hover:bg-gold-500 disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Enter dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-700/50">
          <Link href="/" className="hover:text-gold-500">
            ← Back to the website
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
