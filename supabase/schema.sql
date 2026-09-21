-- MagicFrames — Supabase schema
-- ---------------------------------------------------------------------------
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- after creating a free project. It creates the three content tables used by
-- the site, matching the app types in lib/types.ts (camelCase in the app,
-- snake_case in Postgres).
--
-- The site is a STATIC EXPORT that talks to Supabase from the browser using
-- the anon key, so Row Level Security (RLS) policies below control what the
-- public may read and what authenticated admins may write.

-- Enable UUID generation (available by default on Supabase).
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Image gallery. Maps to GalleryImage { id, title, src, width, height, alt }.
create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  title      text        not null default '',
  src        text        not null default '',
  width      integer     not null,
  height     integer     not null,
  alt        text        not null default '',
  created_at timestamptz not null default now()
);

-- Video gallery. Maps to GalleryVideo
-- { id, title, provider, videoId, thumbnailWidth, thumbnailHeight }.
create table if not exists public.gallery_videos (
  id               uuid primary key default gen_random_uuid(),
  title            text        not null default '',
  provider         text        not null check (provider in ('youtube', 'vimeo')),
  video_id         text        not null,
  thumbnail_width  integer     not null,
  thumbnail_height integer     not null,
  created_at       timestamptz not null default now()
);

-- Latest projects. Maps to Project
-- { id, title, description, coverSrc, coverWidth, coverHeight, date }.
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null default '',
  description  text        not null default '',
  cover_src    text        not null default '',
  cover_width  integer     not null,
  cover_height integer     not null,
  date         text        not null default '',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
-- Strategy:
--   * Anyone (anon) may SELECT — the public website needs to read content.
--   * Only authenticated users (your admin, created via Supabase Auth) may
--     INSERT / UPDATE / DELETE — this powers the /admin dashboard.
--
-- Create your admin user in Supabase Dashboard → Authentication → Users →
-- "Add user", then sign in with that email + password on /admin.

alter table public.gallery_images enable row level security;
alter table public.gallery_videos enable row level security;
alter table public.projects       enable row level security;

-- Public read access.
create policy "Public read images"   on public.gallery_images for select using (true);
create policy "Public read videos"   on public.gallery_videos for select using (true);
create policy "Public read projects" on public.projects       for select using (true);

-- Authenticated write access.
create policy "Admin write images"   on public.gallery_images for all
  to authenticated using (true) with check (true);
create policy "Admin write videos"   on public.gallery_videos for all
  to authenticated using (true) with check (true);
create policy "Admin write projects" on public.projects       for all
  to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for image uploads (optional)
-- ---------------------------------------------------------------------------
-- If you want to host photos on Supabase instead of an external URL, create a
-- public Storage bucket and paste the resulting public file URLs into the
-- `src` / `cover_src` fields in the admin dashboard.
--
--   Dashboard → Storage → Create bucket → name: "media" → Public bucket: ON
--
-- Then upload images there and use each file's public URL. A public bucket
-- serves files at:
--   https://<project-ref>.supabase.co/storage/v1/object/public/media/<file>
--
-- To create the bucket via SQL instead of the UI, uncomment:
-- insert into storage.buckets (id, name, public)
-- values ('media', 'media', true)
-- on conflict (id) do nothing;
