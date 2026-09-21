import { isSupabaseConfigured } from '@/lib/data/provider';

// Client-side auth for the /admin dashboard. Kept static-export compatible:
// there is no server component here. In the local fallback (no Supabase) the
// gate is a simple password compared against NEXT_PUBLIC_ADMIN_PASSWORD, with
// a documented development default. When Supabase is configured we prefer
// Supabase Auth (email + password) so credentials are validated server-side
// by Supabase rather than shipped in the bundle.

/**
 * Development default password used only when NEXT_PUBLIC_ADMIN_PASSWORD is
 * not set. Documented in the README and .env.example. Always override this in
 * production by setting NEXT_PUBLIC_ADMIN_PASSWORD at build time.
 */
export const DEV_ADMIN_PASSWORD = 'magicframes';

const SESSION_KEY = 'magicframes:admin-auth';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function getAdminPassword(): string {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || DEV_ADMIN_PASSWORD;
}

/** Whether the current browser session has already unlocked the dashboard. */
export function isAuthenticated(): boolean {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(SESSION_KEY) === 'true';
}

function setAuthenticated(value: boolean): void {
  if (!isBrowser()) return;
  if (value) {
    window.sessionStorage.setItem(SESSION_KEY, 'true');
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

/**
 * Attempt to unlock the dashboard.
 *
 * - When Supabase is configured, `identifier` is treated as an email and we
 *   sign in via Supabase Auth (password grant).
 * - Otherwise the local password gate compares `password` against the
 *   configured admin password.
 *
 * On success an auth flag is persisted in sessionStorage for the session.
 */
export async function login(password: string, identifier?: string): Promise<LoginResult> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const client = createClient(url, anonKey);
      const email = (identifier ?? '').trim();
      if (!email) {
        return { ok: false, error: 'Enter the email for your Supabase admin user.' };
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, error: error.message };
      }
      setAuthenticated(true);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      return { ok: false, error: message };
    }
  }

  // Local fallback: password gate.
  if (password === getAdminPassword()) {
    setAuthenticated(true);
    return { ok: true };
  }
  return { ok: false, error: 'Incorrect password.' };
}

export function logout(): void {
  setAuthenticated(false);
}
