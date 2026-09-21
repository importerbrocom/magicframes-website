'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PlaceholderImage from '@/components/PlaceholderImage';
import { getDataProvider } from '@/lib/data/provider';
import type { Project } from '@/lib/types';
import { Button, Field, TextArea, TextInput } from './ui';

interface FormState {
  title: string;
  description: string;
  date: string;
  coverSrc: string;
  coverWidth: string;
  coverHeight: string;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  date: '',
  coverSrc: '',
  coverWidth: '600',
  coverHeight: '400',
};

function toForm(project: Project): FormState {
  return {
    title: project.title,
    description: project.description,
    date: project.date,
    coverSrc: project.coverSrc,
    coverWidth: String(project.coverWidth),
    coverHeight: String(project.coverHeight),
  };
}

export default function ProjectsManager() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDataProvider().listProjects();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
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
      description: form.description.trim(),
      date: form.date.trim(),
      coverSrc: form.coverSrc.trim(),
      coverWidth: Number(form.coverWidth),
      coverHeight: Number(form.coverHeight),
    };
    try {
      const provider = getDataProvider();
      if (editingId) {
        await provider.updateProject(editingId, payload);
      } else {
        await provider.addProject(payload);
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
      await getDataProvider().removeProject(id);
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
          {editingId ? 'Edit project' : 'Add project'}
        </h3>
        <Field id="proj-title" label="Title">
          <TextInput
            id="proj-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="A Tuscan Vineyard Wedding"
          />
        </Field>
        <Field id="proj-desc" label="Description">
          <TextArea
            id="proj-desc"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A short story about the day..."
          />
        </Field>
        <Field id="proj-date" label="Date" hint="Shown on the project card, e.g. June 2024.">
          <TextInput
            id="proj-date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            placeholder="June 2024"
          />
        </Field>
        <Field
          id="proj-cover"
          label="Cover image URL"
          hint="Leave blank to keep the annotated placeholder for now."
        >
          <TextInput
            id="proj-cover"
            value={form.coverSrc}
            onChange={(e) => setForm({ ...form, coverSrc: e.target.value })}
            placeholder="https://... or /uploads/cover.jpg"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="proj-width" label="Cover width (px)">
            <TextInput
              id="proj-width"
              type="number"
              min={1}
              value={form.coverWidth}
              onChange={(e) => setForm({ ...form, coverWidth: e.target.value })}
              required
            />
          </Field>
          <Field id="proj-height" label="Cover height (px)">
            <TextInput
              id="proj-height"
              type="number"
              min={1}
              value={form.coverHeight}
              onChange={(e) => setForm({ ...form, coverHeight: e.target.value })}
              required
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-blush-500">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {editingId ? 'Save changes' : 'Add project'}
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
          {loading ? 'Loading…' : `${items.length} project${items.length === 1 ? '' : 's'}`}
        </p>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {items.map((project) => (
              <motion.li
                key={project.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-blush-100"
              >
                <PlaceholderImage
                  src={project.coverSrc}
                  alt={project.title}
                  width={project.coverWidth}
                  height={project.coverHeight}
                  label={project.title}
                  className="w-full"
                />
                <div className="space-y-2 p-4">
                  <p className="font-serif text-lg text-ink-900">{project.title}</p>
                  {project.date ? (
                    <p className="text-xs uppercase tracking-widest text-gold-500">
                      {project.date}
                    </p>
                  ) : null}
                  {project.description ? (
                    <p className="line-clamp-3 text-sm text-ink-700/80">
                      {project.description}
                    </p>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(project.id);
                        setForm(toForm(project));
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(project.id)}
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
