import { isApiMode } from '@/lib/data/provider';
import { getApiBaseUrl, setUnauthorizedHandler } from '@/lib/data/api';

// Auth for the /admin dashboard.
//
// In API mode (the normal deployed setup) authentication is performed by the
// PHP backend: `api/auth.php` verifies the submitted password against a bcrypt
// hash stored in MySQL and, on success, establishes an HttpOnly PHP session
// cookie. The browser never sees a password hash and no credential is baked
// into the JavaScript bundle, so this is a real authentication boundary rather
// than a UI gate.
//
// In forced-local mode (NEXT_PUBLIC_USE_LOCAL=1, for offline design work with
// no database) there is no server to talk to, so a simple development password
// gate is used. That mode writes only to the current browser's localStorage.

/** Development-only password, used solely when NEXT_PUBLIC_USE_LOCAL=1. */
export const DEV_ADMIN_PASSWORD = 'magicframes';

const SESSION_KEY = 'magicframes:admin-auth';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function getAdminPassword(): string {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD || DEV_ADMIN_PASSWORD;
}

/** Cached hint used to render the dashboard immediately on reload. */
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

// Listeners notified when the server rejects us as unauthenticated, so the
// dashboard can drop back to the login form.
const authListeners = new Set<(authed: boolean) => void>();

export function onAuthChange(listener: (authed: boolean) => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notifyAuthChange(authed: boolean): void {
  authListeners.forEach((listener) => listener(authed));
}

// A 401 from any API call means the PHP session is gone.
setUnauthorizedHandler(() => {
  setAuthenticated(false);
  notifyAuthChange(false);
});

/**
 * Incremented on every successful login so a slower, earlier `verifySession()`
 * response cannot overwrite a newer login result.
 */
let loginGeneration = 0;

/**
 * Ask the server whether the current session cookie is still valid. Used on
 * mount so a stale sessionStorage hint cannot keep the dashboard unlocked
 * after the PHP session has expired.
 */
export async function verifySession(): Promise<boolean> {
  if (!isApiMode()) {
    return isAuthenticated();
  }
  const generation = loginGeneration;
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth.php?action=me`, {
      credentials: 'include',
    });
    // A login that completed while this request was in flight wins.
    if (generation !== loginGeneration) {
      return isAuthenticated();
    }
    if (!response.ok) {
      setAuthenticated(false);
      return false;
    }
    const data = (await response.json()) as { authenticated?: boolean };
    if (generation !== loginGeneration) {
      return isAuthenticated();
    }
    const ok = data.authenticated === true;
    setAuthenticated(ok);
    return ok;
  } catch {
    // Network/API unreachable — fall back to the cached hint rather than
    // locking the user out of a dashboard they may have legitimately opened.
    return isAuthenticated();
  }
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

/**
 * Sign in to the dashboard.
 *
 * In API mode the username + password are POSTed to api/auth.php and validated
 * server-side against the bcrypt hash in MySQL. In forced-local mode the
 * password is compared against the development password.
 */
export async function login(password: string, identifier?: string): Promise<LoginResult> {
  if (isApiMode()) {
    const username = (identifier ?? '').trim();
    if (!username) {
      return { ok: false, error: 'Enter your admin username.' };
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth.php?action=login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const text = await response.text();
      let payload: { error?: string } | null = null;
      if (text !== '') {
        try {
          payload = JSON.parse(text) as { error?: string };
        } catch {
          return {
            ok: false,
            error:
              'The server returned an unexpected response. Check that the api/ folder is uploaded and api/config.php is set up.',
          };
        }
      }

      if (!response.ok) {
        return { ok: false, error: payload?.error ?? 'Sign in failed.' };
      }

      loginGeneration += 1;
      setAuthenticated(true);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Could not reach the server. Check your connection and that api/ is deployed.',
      };
    }
  }

  // Forced-local mode: development password gate, no server involved.
  if (password === getAdminPassword()) {
    setAuthenticated(true);
    return { ok: true };
  }
  return { ok: false, error: 'Incorrect password.' };
}

/** Sign out, destroying the PHP session server-side when in API mode. */
export async function logout(): Promise<void> {
  if (isApiMode()) {
    try {
      await fetch(`${getApiBaseUrl()}/auth.php?action=logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      // Even if the request fails, clear the local hint below.
    }
  }
  setAuthenticated(false);
}
