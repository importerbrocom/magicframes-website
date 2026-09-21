import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import ImageGallery from '@/components/sections/ImageGallery';
import VideoGallery from '@/components/sections/VideoGallery';
import LatestProjects from '@/components/sections/LatestProjects';
import Contact from '@/components/sections/Contact';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
      <ImageGallery />
      <VideoGallery />
      <LatestProjects />
      <Contact />
    </main>
  );
}
