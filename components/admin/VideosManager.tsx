'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import { getDataProvider } from '@/lib/data/provider';
import type { GalleryVideo, VideoProvider } from '@/lib/types';
import { detectProvider, parseVideoId } from '@/lib/video';
import { Button, Field, Select, TextInput } from './ui';

interface FormState {
  title: string;
  provider: VideoProvider;
  url: string;
  thumbnailWidth: string;
  thumbnailHeight: string;
}

const EMPTY: FormState = {
  title: '',
  provider: 'youtube',
  url: '',
  thumbnailWidth: '1280',
  thumbnailHeight: '720',
};

function toForm(video: GalleryVideo): FormState {
  return {
    title: video.title,
    provider: video.provider,
    url: video.videoId,
    thumbnailWidth: String(video.thumbnailWidth),
    thumbnailHeight: String(video.thumbnailHeight),
  };
}

export default function VideosManager() {
  const [items, setItems] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDataProvider().listVideos();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function handleUrlChange(value: string) {
    const detected = detectProvider(value);
    setForm((prev) => ({ ...prev, url: value, provider: detected ?? prev.provider }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const videoId = parseVideoId(form.url, form.provider);
    if (!videoId) {
      setError('Enter a valid video URL or ID.');
      setBusy(false);
      return;
    }
    const payload = {
      title: form.title.trim(),
      provider: form.provider,
      videoId,
      thumbnailWidth: Number(form.thumbnailWidth),
      thumbnailHeight: Number(form.thumbnailHeight),
    };
    try {
      const provider = getDataProvider();
      if (editingId) {
        await provider.updateVideo(editingId, payload);
      } else {
        await provider.addVideo(payload);
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await getDataProvider().removeVideo(id);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blush-100"
      >
        <h3 className="font-serif text-2xl text-ink-900">
          {editingId ? 'Edit video' : 'Add video'}
        </h3>
        <Field id="vid-title" label="Title">
          <TextInput
            id="vid-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Anna & Liam — Highlight film"
          />
        </Field>
        <Field id="vid-provider" label="Provider">
          <Select
            id="vid-provider"
            value={form.provider}
            onChange={(e) =>
              setForm({ ...form, provider: e.target.value as VideoProvider })
            }
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </Select>
        </Field>
        <Field
          id="vid-url"
          label="Video URL or ID"
          hint="Paste the full YouTube/Vimeo link and the ID is extracted automatically. Unlisted Vimeo links (with a privacy hash) are supported."
        >
          <TextInput
            id="vid-url"
            value={form.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            placeholder="https://youtu.be/dQw4w9WgXcQ"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="vid-width" label="Thumb width (px)">
            <TextInput
              id="vid-width"
              type="number"
              min={1}
              value={form.thumbnailWidth}
              onChange={(e) => setForm({ ...form, thumbnailWidth: e.target.value })}
              required
            />
          </Field>
          <Field id="vid-height" label="Thumb height (px)">
            <TextInput
              id="vid-height"
              type="number"
              min={1}
              value={form.thumbnailHeight}
              onChange={(e) => setForm({ ...form, thumbnailHeight: e.target.value })}
              required
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-blush-500">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {editingId ? 'Save changes' : 'Add video'}
          </Button>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm} disabled={busy}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div>
        <p className="mb-4 text-xs uppercase tracking-widest text-ink-700/60">
          {loading ? 'Loading…' : `${items.length} video${items.length === 1 ? '' : 's'}`}
        </p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {items.map((video) => (
              <motion.li
                key={video.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blush-100"
              >
                <PlaceholderImage
                  alt={video.title}
                  width={video.thumbnailWidth}
                  height={video.thumbnailHeight}
                  label={`${video.provider} · ${video.videoId}`}
                  className="w-full"
                />
                <div className="space-y-2 p-3">
                  <p className="truncate font-serif text-sm text-ink-900">{video.title}</p>
                  <p className="text-xs uppercase tracking-widest text-gold-500">
                    {video.provider}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(video.id);
                        setForm(toForm(video));
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(video.id)}
                      disabled={busy}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
