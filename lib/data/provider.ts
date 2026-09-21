import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';

// A single async CRUD abstraction over the three content types.
//
// Implementations:
//  - `api.ts`   — the PHP + MySQL REST API in `api/` (production on Hostinger).
//  - `local.ts` — browser localStorage, seeded with placeholder demo content,
//                 used for local development with no database.
//
// Selection rules (see `getDataProvider`):
//  - During the static export / server render there is no `window`, so the
//    local provider's seed data is used to prerender the markup.
//  - In the browser the API provider is used by default, because a deployed
//    site always ships the api/ folder alongside it.
//  - Set NEXT_PUBLIC_USE_LOCAL=1 at build time to force the localStorage
//    provider instead (handy for design work without a database).

export interface DataProvider {
  listImages(): Promise<GalleryImage[]>;
  addImage(image: Omit<GalleryImage, 'id'>): Promise<GalleryImage>;
  updateImage(id: string, patch: Partial<Omit<GalleryImage, 'id'>>): Promise<GalleryImage>;
  removeImage(id: string): Promise<void>;

  listVideos(): Promise<GalleryVideo[]>;
  addVideo(video: Omit<GalleryVideo, 'id'>): Promise<GalleryVideo>;
  updateVideo(id: string, patch: Partial<Omit<GalleryVideo, 'id'>>): Promise<GalleryVideo>;
  removeVideo(id: string): Promise<void>;

  listProjects(): Promise<Project[]>;
  addProject(project: Omit<Project, 'id'>): Promise<Project>;
  updateProject(id: string, patch: Partial<Omit<Project, 'id'>>): Promise<Project>;
  removeProject(id: string): Promise<void>;
}

/** True when the build explicitly opts into the localStorage provider. */
export function isLocalModeForced(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCAL === '1';
}

/**
 * Whether the app is talking to the PHP + MySQL API. False during the static
 * export (no `window`) and when local mode is forced.
 */
export function isApiMode(): boolean {
  if (isLocalModeForced()) return false;
  return typeof window !== 'undefined';
}

let cached: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (cached) return cached;

  if (isApiMode()) {
    const { createApiProvider } = require('./api') as typeof import('./api');
    cached = createApiProvider();
  } else {
    const { createLocalProvider } = require('./local') as typeof import('./local');
    cached = createLocalProvider();
  }

  return cached;
}
