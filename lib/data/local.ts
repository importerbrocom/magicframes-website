import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';
import type { DataProvider } from './provider';
import { seedImages, seedVideos, seedProjects } from './seed';

// Browser localStorage-backed provider used when Supabase isn't configured.
// It seeds placeholder demo data on first use so the app is fully testable
// with no external accounts. On the server (during static export) it falls
// back to reading from the seed data only.

const KEYS = {
  images: 'magicframes:images',
  videos: 'magicframes:videos',
  projects: 'magicframes:projects',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function read<T>(key: string, seed: T[]): T[] {
  if (!isBrowser()) return [...seed];
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return [...seed];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [...seed];
  }
}

function write<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createLocalProvider(): DataProvider {
  return {
    async listImages() {
      return read<GalleryImage>(KEYS.images, seedImages);
    },
    async addImage(image) {
      const items = read<GalleryImage>(KEYS.images, seedImages);
      const created: GalleryImage = { ...image, id: generateId('img') };
      const next = [created, ...items];
      write(KEYS.images, next);
      return created;
    },
    async updateImage(id, patch) {
      const items = read<GalleryImage>(KEYS.images, seedImages);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`Image not found: ${id}`);
      const updated: GalleryImage = { ...items[index], ...patch, id };
      items[index] = updated;
      write(KEYS.images, items);
      return updated;
    },
    async removeImage(id) {
      const items = read<GalleryImage>(KEYS.images, seedImages);
      write(
        KEYS.images,
        items.filter((item) => item.id !== id),
      );
    },

    async listVideos() {
      return read<GalleryVideo>(KEYS.videos, seedVideos);
    },
    async addVideo(video) {
      const items = read<GalleryVideo>(KEYS.videos, seedVideos);
      const created: GalleryVideo = { ...video, id: generateId('vid') };
      const next = [created, ...items];
      write(KEYS.videos, next);
      return created;
    },
    async updateVideo(id, patch) {
      const items = read<GalleryVideo>(KEYS.videos, seedVideos);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`Video not found: ${id}`);
      const updated: GalleryVideo = { ...items[index], ...patch, id };
      items[index] = updated;
      write(KEYS.videos, items);
      return updated;
    },
    async removeVideo(id) {
      const items = read<GalleryVideo>(KEYS.videos, seedVideos);
      write(
        KEYS.videos,
        items.filter((item) => item.id !== id),
      );
    },

    async listProjects() {
      return read<Project>(KEYS.projects, seedProjects);
    },
    async addProject(project) {
      const items = read<Project>(KEYS.projects, seedProjects);
      const created: Project = { ...project, id: generateId('proj') };
      const next = [created, ...items];
      write(KEYS.projects, next);
      return created;
    },
    async updateProject(id, patch) {
      const items = read<Project>(KEYS.projects, seedProjects);
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`Project not found: ${id}`);
      const updated: Project = { ...items[index], ...patch, id };
      items[index] = updated;
      write(KEYS.projects, items);
      return updated;
    },
    async removeProject(id) {
      const items = read<Project>(KEYS.projects, seedProjects);
      write(
        KEYS.projects,
        items.filter((item) => item.id !== id),
      );
    },
  };
}
