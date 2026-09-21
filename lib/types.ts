// Shared content types used across the public site and admin dashboard.

export interface GalleryImage {
  id: string;
  title: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

export type VideoProvider = 'youtube' | 'vimeo';

export interface GalleryVideo {
  id: string;
  title: string;
  provider: VideoProvider;
  videoId: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  coverSrc: string;
  coverWidth: number;
  coverHeight: number;
  date: string;
}

export type ContentType = 'images' | 'videos' | 'projects';
