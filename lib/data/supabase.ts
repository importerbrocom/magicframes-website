import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';
import type { DataProvider } from './provider';

// Supabase-backed provider. Used when NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Called client-side from the static
// site. Table columns are snake_case in Postgres and mapped to/from the
// camelCase app types here.

const TABLES = {
  images: 'gallery_images',
  videos: 'gallery_videos',
  projects: 'projects',
} as const;

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase env vars are not configured.');
  }
  return createClient(url, anonKey);
}

type Row = Record<string, unknown>;

function toImage(row: Row): GalleryImage {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    src: (row.src as string | null) ?? '',
    width: Number(row.width),
    height: Number(row.height),
    alt: (row.alt as string | null) ?? '',
  };
}

function toVideo(row: Row): GalleryVideo {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    provider: row.provider as GalleryVideo['provider'],
    videoId: String(row.video_id ?? ''),
    thumbnailWidth: Number(row.thumbnail_width),
    thumbnailHeight: Number(row.thumbnail_height),
  };
}

function toProject(row: Row): Project {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    description: (row.description as string | null) ?? '',
    coverSrc: (row.cover_src as string | null) ?? '',
    coverWidth: Number(row.cover_width),
    coverHeight: Number(row.cover_height),
    date: String(row.date ?? ''),
  };
}

function imageToRow(image: Partial<Omit<GalleryImage, 'id'>>) {
  const row: Record<string, unknown> = {};
  if (image.title !== undefined) row.title = image.title;
  if (image.src !== undefined) row.src = image.src;
  if (image.width !== undefined) row.width = image.width;
  if (image.height !== undefined) row.height = image.height;
  if (image.alt !== undefined) row.alt = image.alt;
  return row;
}

function videoToRow(video: Partial<Omit<GalleryVideo, 'id'>>) {
  const row: Record<string, unknown> = {};
  if (video.title !== undefined) row.title = video.title;
  if (video.provider !== undefined) row.provider = video.provider;
  if (video.videoId !== undefined) row.video_id = video.videoId;
  if (video.thumbnailWidth !== undefined) row.thumbnail_width = video.thumbnailWidth;
  if (video.thumbnailHeight !== undefined) row.thumbnail_height = video.thumbnailHeight;
  return row;
}

function projectToRow(project: Partial<Omit<Project, 'id'>>) {
  const row: Record<string, unknown> = {};
  if (project.title !== undefined) row.title = project.title;
  if (project.description !== undefined) row.description = project.description;
  if (project.coverSrc !== undefined) row.cover_src = project.coverSrc;
  if (project.coverWidth !== undefined) row.cover_width = project.coverWidth;
  if (project.coverHeight !== undefined) row.cover_height = project.coverHeight;
  if (project.date !== undefined) row.date = project.date;
  return row;
}

export function createSupabaseProvider(): DataProvider {
  const client = getClient();

  return {
    async listImages() {
      const { data, error } = await client
        .from(TABLES.images)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toImage);
    },
    async addImage(image) {
      const { data, error } = await client
        .from(TABLES.images)
        .insert(imageToRow(image))
        .select()
        .single();
      if (error) throw error;
      return toImage(data);
    },
    async updateImage(id, patch) {
      const { data, error } = await client
        .from(TABLES.images)
        .update(imageToRow(patch))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return toImage(data);
    },
    async removeImage(id) {
      const { error } = await client.from(TABLES.images).delete().eq('id', id);
      if (error) throw error;
    },

    async listVideos() {
      const { data, error } = await client
        .from(TABLES.videos)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toVideo);
    },
    async addVideo(video) {
      const { data, error } = await client
        .from(TABLES.videos)
        .insert(videoToRow(video))
        .select()
        .single();
      if (error) throw error;
      return toVideo(data);
    },
    async updateVideo(id, patch) {
      const { data, error } = await client
        .from(TABLES.videos)
        .update(videoToRow(patch))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return toVideo(data);
    },
    async removeVideo(id) {
      const { error } = await client.from(TABLES.videos).delete().eq('id', id);
      if (error) throw error;
    },

    async listProjects() {
      // Order by the wedding `date` (newest first) so "Latest Projects" is
      // genuinely latest-first; fall back to insertion order for ties.
      const { data, error } = await client
        .from(TABLES.projects)
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toProject);
    },
    async addProject(project) {
      const { data, error } = await client
        .from(TABLES.projects)
        .insert(projectToRow(project))
        .select()
        .single();
      if (error) throw error;
      return toProject(data);
    },
    async updateProject(id, patch) {
      const { data, error } = await client
        .from(TABLES.projects)
        .update(projectToRow(patch))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return toProject(data);
    },
    async removeProject(id) {
      const { error } = await client.from(TABLES.projects).delete().eq('id', id);
      if (error) throw error;
    },
  };
}
