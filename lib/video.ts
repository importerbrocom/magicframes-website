import type { VideoProvider } from '@/lib/types';

// Helpers for turning a pasted YouTube/Vimeo URL (or a bare ID) into the
// stored `videoId`, and for inferring the provider from a URL.

/** Infer the provider from a URL. Returns null when it can't be determined. */
export function detectProvider(input: string): VideoProvider | null {
  const value = input.trim().toLowerCase();
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('vimeo.com')) return 'vimeo';
  return null;
}

// Vimeo unlisted (private) videos carry a privacy hash that must travel with
// the numeric ID for the embed to load. We keep the whole `videoId` string as
// the source of truth and encode the hash as `<id>:<hash>`, then split it back
// out when building the embed URL (see parseVimeoEmbed / lib video usage).
const VIMEO_HASH_SEP = ':';

/**
 * Extract the video ID from a YouTube or Vimeo URL. If the input is not a URL
 * (no protocol / no known host) it is treated as an already-clean ID and
 * returned trimmed.
 *
 * For unlisted Vimeo videos the privacy hash is preserved and stored alongside
 * the numeric ID as `<id>:<hash>`.
 */
export function parseVideoId(input: string, provider: VideoProvider): string {
  const value = input.trim();
  if (!value) return '';

  // Not a URL -> assume it's already an ID (which may already be `<id>:<hash>`).
  if (!value.includes('/') && !value.includes('.') && !value.includes('?')) {
    return value;
  }

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);

    if (provider === 'youtube') {
      // youtu.be/<id>
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace(/^\//, '').split('/')[0] || value;
      }
      // youtube.com/watch?v=<id>
      const v = url.searchParams.get('v');
      if (v) return v;
      // youtube.com/embed/<id> or /shorts/<id>
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      return parts[parts.length - 1] || value;
    }

    // vimeo: vimeo.com/<id>, vimeo.com/<id>/<hash>,
    // player.vimeo.com/video/<id>?h=<hash>, or ...?h=<hash>
    const parts = url.pathname.split('/').filter(Boolean);
    const idIndex = parts.findIndex((p) => /^\d+$/.test(p));
    const numeric = idIndex === -1 ? undefined : parts[idIndex];
    // Hash can be the path segment right after the id, or a `h` query param.
    const hash =
      url.searchParams.get('h') ||
      (idIndex !== -1 && parts[idIndex + 1] && /^[a-z0-9]+$/i.test(parts[idIndex + 1])
        ? parts[idIndex + 1]
        : undefined);
    const id = numeric ?? parts[0] ?? value;
    return hash ? `${id}${VIMEO_HASH_SEP}${hash}` : id;
  } catch {
    return value;
  }
}

/**
 * Split a stored Vimeo `videoId` into its numeric id and optional privacy
 * hash. Accepts both the plain `<id>` and the `<id>:<hash>` forms.
 */
export function parseVimeoId(videoId: string): { id: string; hash?: string } {
  const [id, hash] = videoId.split(VIMEO_HASH_SEP);
  return hash ? { id, hash } : { id };
}
