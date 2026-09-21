import type { GalleryImage, GalleryVideo, Project } from '@/lib/types';

// Placeholder demo data. Real images/videos are added later via the admin
// dashboard. The `src`/`coverSrc` values are intentionally empty so the
// PlaceholderImage component renders a labeled box at the stated dimensions.

export const seedImages: GalleryImage[] = [
  { id: 'img-1', title: 'Sunset Vows', src: '', width: 1920, height: 1080, alt: 'Couple exchanging vows at sunset' },
  { id: 'img-2', title: 'First Dance', src: '', width: 1080, height: 1350, alt: 'Newlyweds during their first dance' },
  { id: 'img-3', title: 'Bridal Portrait', src: '', width: 1200, height: 1600, alt: 'Bride portrait in natural light' },
  { id: 'img-4', title: 'Ring Detail', src: '', width: 1600, height: 1067, alt: 'Close-up of wedding rings' },
  { id: 'img-5', title: 'Ceremony Aisle', src: '', width: 1920, height: 1280, alt: 'Decorated ceremony aisle' },
  { id: 'img-6', title: 'Reception Toast', src: '', width: 1440, height: 960, alt: 'Guests toasting at reception' },
];

export const seedVideos: GalleryVideo[] = [
  { id: 'vid-1', title: 'Cinematic Highlight', provider: 'youtube', videoId: 'dQw4w9WgXcQ', thumbnailWidth: 1280, thumbnailHeight: 720 },
  { id: 'vid-2', title: 'Full Ceremony Film', provider: 'vimeo', videoId: '76979871', thumbnailWidth: 1280, thumbnailHeight: 720 },
  { id: 'vid-3', title: 'Behind the Scenes', provider: 'youtube', videoId: 'aqz-KE-bpKQ', thumbnailWidth: 1280, thumbnailHeight: 720 },
];

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Aisha & Rohan — Beach Wedding',
    description: 'A breezy seaside celebration captured across two golden days.',
    coverSrc: '',
    coverWidth: 1600,
    coverHeight: 900,
    date: '2024-11-12',
  },
  {
    id: 'proj-2',
    title: 'Meera & Karan — Palace Affair',
    description: 'Regal interiors, candlelit corridors, and timeless portraits.',
    coverSrc: '',
    coverWidth: 1600,
    coverHeight: 900,
    date: '2024-09-28',
  },
  {
    id: 'proj-3',
    title: 'Sara & Dev — Garden Ceremony',
    description: 'An intimate garden gathering framed by spring blooms.',
    coverSrc: '',
    coverWidth: 1600,
    coverHeight: 900,
    date: '2024-06-04',
  },
];
