import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';

// A single async CRUD abstraction over the three content types. Concrete
// implementations live in `local.ts` (browser localStorage fallback) and
// `supabase.ts` (managed Postgres). `getDataProvider` chooses which one to
// use based on the presence of the Supabase env vars.

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

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

let cached: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (cached) return cached;

  if (isSupabaseConfigured()) {
    // Lazy import so the local fallback works even if Supabase isn't set up.
    const { createSupabaseProvider } = require('./supabase') as typeof import('./supabase');
    cached = createSupabaseProvider();
  } else {
    const { createLocalProvider } = require('./local') as typeof import('./local');
    cached = createLocalProvider();
  }

  return cached;
}
