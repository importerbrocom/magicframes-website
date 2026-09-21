import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';
import type { DataProvider } from './provider';

// DataProvider implementation backed by the PHP + MySQL REST API in `api/`.
//
// The API is deployed same-origin (the static site and the api/ folder live
// under the same document root), so the default base URL is the relative
// '/api'. That means a standard deployment needs no configuration at all.
// Set NEXT_PUBLIC_API_BASE_URL only when the API lives on another origin.
//
// Reads are public; writes rely on the PHP session cookie established by
// `login()` in lib/auth.ts, which is why every request uses
// `credentials: 'include'`.

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const base = configured && configured !== '' ? configured : '/api';
  return base.replace(/\/$/, '');
}

interface ApiErrorBody {
  error?: string;
}

/** Perform a JSON request and surface the server's error message on failure. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: 'include',
    headers:
      init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text !== '') {
    try {
      payload = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. a PHP fatal error or an HTML error page).
      if (!response.ok) {
        throw new Error(
          `Server error (${response.status}). Check that api/ is uploaded and api/config.php is configured.`,
        );
      }
      throw new Error('The server returned an unexpected response.');
    }
  }

  if (!response.ok) {
    const message = (payload as ApiErrorBody | null)?.error;
    if (response.status === 401) {
      throw new Error(message ?? 'Your session expired. Please sign in again.');
    }
    throw new Error(message ?? `Request failed (${response.status}).`);
  }

  return payload as T;
}

function jsonBody(data: unknown): RequestInit {
  return { body: JSON.stringify(data) };
}

export function createApiProvider(): DataProvider {
  return {
    // ---- Images ----
    async listImages() {
      return request<GalleryImage[]>('/images.php');
    },
    async addImage(image) {
      return request<GalleryImage>('/images.php', {
        method: 'POST',
        ...jsonBody(image),
      });
    },
    async updateImage(id, patch) {
      return request<GalleryImage>(`/images.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        ...jsonBody(patch),
      });
    },
    async removeImage(id) {
      await request<{ ok: boolean }>(`/images.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    // ---- Videos ----
    async listVideos() {
      return request<GalleryVideo[]>('/videos.php');
    },
    async addVideo(video) {
      return request<GalleryVideo>('/videos.php', {
        method: 'POST',
        ...jsonBody(video),
      });
    },
    async updateVideo(id, patch) {
      return request<GalleryVideo>(`/videos.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        ...jsonBody(patch),
      });
    },
    async removeVideo(id) {
      await request<{ ok: boolean }>(`/videos.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    // ---- Projects ----
    async listProjects() {
      return request<Project[]>('/projects.php');
    },
    async addProject(project) {
      return request<Project>('/projects.php', {
        method: 'POST',
        ...jsonBody(project),
      });
    },
    async updateProject(id, patch) {
      return request<Project>(`/projects.php?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        ...jsonBody(patch),
      });
    },
    async removeProject(id) {
      await request<{ ok: boolean }>(`/projects.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}

export interface UploadResult {
  ok: boolean;
  url: string;
  width: number;
  height: number;
}

/**
 * Upload an image file to the authenticated PHP upload endpoint and return the
 * public URL to store in an image's `src` or a project's `coverSrc`.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/upload.php`, {
    method: 'POST',
    credentials: 'include',
    body: form, // Let the browser set the multipart boundary.
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text !== '') {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `Upload failed (${response.status}). The server returned an unexpected response.`,
      );
    }
  }

  if (!response.ok) {
    const message = (payload as ApiErrorBody | null)?.error;
    throw new Error(message ?? `Upload failed (${response.status}).`);
  }

  return payload as UploadResult;
}
