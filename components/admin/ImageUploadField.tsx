'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/data/api';
import { isApiMode } from '@/lib/data/provider';

interface ImageUploadFieldProps {
  /** Called with the public URL and the detected pixel dimensions. */
  onUploaded: (result: { url: string; width: number; height: number }) => void;
  label?: string;
}

/**
 * Upload an image file to api/upload.php and hand back the public URL.
 *
 * The upload endpoint requires an authenticated admin session, so this is only
 * offered in API mode. In local preview mode (no server) we explain that a URL
 * must be pasted instead.
 */
export default function ImageUploadField({
  onUploaded,
  label = 'Or upload a photo',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!isApiMode()) {
    return (
      <p className="text-xs text-ink-700/50">
        Uploading needs the PHP backend. In local preview mode, paste an image URL above.
      </p>
    );
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const result = await uploadImage(file);
      onUploaded({ url: result.url, width: result.width, height: result.height });
      setDone(`Uploaded (${result.width} x ${result.height})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      // Allow re-selecting the same file after an error.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="block text-xs uppercase tracking-widest text-ink-700/70">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        disabled={busy}
        className="mt-2 w-full cursor-pointer rounded-lg border border-dashed border-blush-200 bg-blush-50 px-4 py-2.5 text-sm text-ink-700 outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-ink-900 file:px-4 file:py-1.5 file:text-xs file:uppercase file:tracking-widest file:text-blush-50 hover:border-gold-400 disabled:opacity-50"
      />
      {busy ? <p className="mt-1 text-xs text-ink-700/60">Uploading…</p> : null}
      {done ? <p className="mt-1 text-xs text-gold-600">{done}</p> : null}
      {error ? <p className="mt-1 text-xs text-blush-500">{error}</p> : null}
      {!busy && !done && !error ? (
        <p className="mt-1 text-xs text-ink-700/50">
          JPG, PNG, WebP, or GIF — up to 8 MB. The size fields fill in automatically.
        </p>
      ) : null}
    </div>
  );
}
