'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import { getDataProvider } from '@/lib/data/provider';
import type { GalleryImage } from '@/lib/types';
import { Button, Field, TextInput } from './ui';

interface FormState {
  title: string;
  src: string;
  alt: string;
  width: string;
  height: string;
}

const EMPTY: FormState = { title: '', src: '', alt: '', width: '1600', height: '1067' };

function toForm(image: GalleryImage): FormState {
  return {
    title: image.title,
    src: image.src,
    alt: image.alt,
    width: String(image.width),
    height: String(image.height),
  };
}

export default function ImagesManager() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDataProvider().listImages();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images.');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      src: form.src.trim(),
      alt: form.alt.trim() || form.title.trim(),
      width: Number(form.width),
      height: Number(form.height),
    };
    try {
      const provider = getDataProvider();
      if (editingId) {
        await provider.updateImage(editingId, payload);
      } else {
        await provider.addImage(payload);
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
      await getDataProvider().removeImage(id);
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
          {editingId ? 'Edit image' : 'Add image'}
        </h3>
        <Field id="img-title" label="Title">
          <TextInput
            id="img-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Sunset ceremony"
          />
        </Field>
        <Field
          id="img-src"
          label="Image URL"
          hint="Leave blank to keep the annotated placeholder for now."
        >
          <TextInput
            id="img-src"
            value={form.src}
            onChange={(e) => setForm({ ...form, src: e.target.value })}
            placeholder="https://... or /uploads/photo.jpg"
          />
        </Field>
        <Field id="img-alt" label="Alt text">
          <TextInput
            id="img-alt"
            value={form.alt}
            onChange={(e) => setForm({ ...form, alt: e.target.value })}
            placeholder="Bride and groom at sunset"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="img-width" label="Width (px)">
            <TextInput
              id="img-width"
              type="number"
              min={1}
              value={form.width}
              onChange={(e) => setForm({ ...form, width: e.target.value })}
              required
            />
          </Field>
          <Field id="img-height" label="Height (px)">
            <TextInput
              id="img-height"
              type="number"
              min={1}
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              required
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-blush-500">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {editingId ? 'Save changes' : 'Add image'}
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
          {loading ? 'Loading…' : `${items.length} image${items.length === 1 ? '' : 's'}`}
        </p>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <AnimatePresence>
            {items.map((image) => (
              <motion.li
                key={image.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blush-100"
              >
                <PlaceholderImage
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  label={image.title}
                  className="w-full"
                />
                <div className="space-y-2 p-3">
                  <p className="truncate font-serif text-sm text-ink-900">{image.title}</p>
                  <p className="text-xs text-ink-700/50">
                    {image.width} x {image.height}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(image.id);
                        setForm(toForm(image));
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(image.id)}
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
