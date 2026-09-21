/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the site can be uploaded to Hostinger shared hosting
  // (no persistent Node server). See README for deployment notes.
  output: 'export',
  images: {
    // Required for static export: Next.js Image Optimization needs a server.
    unoptimized: true,
  },
  // Emits directory-style URLs (e.g. /gallery/index.html) that map cleanly
  // to files served by LiteSpeed/Apache on shared hosting.
  trailingSlash: true,
};

export default nextConfig;
