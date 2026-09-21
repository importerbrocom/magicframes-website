const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'YouTube', href: '#' },
  { label: 'Vimeo', href: '#' },
  { label: 'Pinterest', href: '#' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-blush-200 bg-blush-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <a
            href="#top"
            className="font-serif text-2xl font-semibold tracking-tight text-ink-900"
          >
            Magic<span className="text-gold-500">frames</span>
          </a>
          <p className="mt-4 max-w-xs text-sm text-ink-700">
            Wedding photography &amp; films crafting timeless, cinematic love
            stories.
          </p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-ink-700/60">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>
              <a href="#gallery" className="hover:text-gold-500">
                Photo Gallery
              </a>
            </li>
            <li>
              <a href="#films" className="hover:text-gold-500">
                Wedding Films
              </a>
            </li>
            <li>
              <a href="#projects" className="hover:text-gold-500">
                Latest Projects
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-gold-500">
                About Us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-ink-700/60">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>
              <a href="mailto:hello@magicframes.studio" className="hover:text-gold-500">
                hello@magicframes.studio
              </a>
            </li>
            <li>
              <a href="tel:+10000000000" className="hover:text-gold-500">
                +1 (000) 000-0000
              </a>
            </li>
            <li>Studio by appointment</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-ink-700/60">
            Follow
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="hover:text-gold-500">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-blush-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-ink-700/70 sm:flex-row">
          <p>© {year} Magicframes. All rights reserved.</p>
          <p>Crafted with love for unforgettable days.</p>
        </div>
      </div>
    </footer>
  );
}
