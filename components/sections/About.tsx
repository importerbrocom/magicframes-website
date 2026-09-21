import PlaceholderImage from '@/components/PlaceholderImage';
import Reveal from '@/components/Reveal';

const STATS = [
  { value: '250+', label: 'Weddings filmed' },
  { value: '12', label: 'Years of stories' },
  { value: '30+', label: 'Destinations' },
];

export default function About() {
  return (
    <section id="about" className="bg-blush-50 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <PlaceholderImage
            alt="Magicframes studio portrait"
            label="About portrait"
            width={800}
            height={1000}
            className="rounded-3xl shadow-lg"
          />
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500">
            Who we are
          </p>
          <h2 className="mt-4 font-serif text-4xl text-ink-900 sm:text-5xl">
            Storytellers behind the frame
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
            Magicframes is a boutique studio devoted to weddings. We blend
            documentary honesty with cinematic craft, so your day feels as alive
            in years to come as it did in the moment.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            From intimate garden ceremonies to grand celebrations, we travel
            wherever love takes us — always chasing light, emotion, and the
            details that make your story yours.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="font-serif text-3xl text-gold-500 sm:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs uppercase tracking-widest text-ink-700/70">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
