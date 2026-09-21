'use client';

import { useState } from 'react';
import Reveal from '@/components/Reveal';

const CONTACT_EMAIL = 'hello@magicframes.studio';

// Browsers/OSes truncate very long `mailto:` URLs. Keep the composed link
// comfortably under common limits (~2000 chars) and warn before that so a long
// enquiry is never silently dropped.
const MAILTO_SAFE_LENGTH = 1800;

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Static-export friendly: no server. Compose a mailto with the entered
  // details so the visitor's mail client handles delivery.
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Wedding enquiry from ${name || 'a couple'}`,
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\n${message}`,
  )}`;

  // A long message can push the mailto URL past what the browser/OS accepts,
  // which would truncate the body. Detect that and steer to a direct email.
  const mailtoTooLong = mailtoHref.length > MAILTO_SAFE_LENGTH;

  return (
    <section id="contact" className="bg-blush-50 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-gold-500">
            Get in touch
          </p>
          <h2 className="mt-4 font-serif text-4xl text-ink-900 sm:text-5xl">
            Let&apos;s tell your story
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-700">
            Share a few details about your day and we will get back to you with
            availability and packages. We would love to hear from you.
          </p>

          <dl className="mt-10 space-y-5 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink-700/60">
                Email
              </dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-serif text-lg text-ink-900 hover:text-gold-500"
                >
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink-700/60">
                Phone
              </dt>
              <dd className="mt-1">
                <a
                  href="tel:+10000000000"
                  className="font-serif text-lg text-ink-900 hover:text-gold-500"
                >
                  +1 (000) 000-0000
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink-700/60">
                Studio
              </dt>
              <dd className="mt-1 font-serif text-lg text-ink-900">
                By appointment · Worldwide
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            className="space-y-5 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-blush-100"
            onSubmit={(e) => {
              e.preventDefault();
              // Guard against silent truncation: only open the mailto when the
              // URL is within a safe length, otherwise the warning below tells
              // the visitor to email us directly.
              if (mailtoTooLong) return;
              window.location.href = mailtoHref;
            }}
          >
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs uppercase tracking-widest text-ink-700/70"
              >
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-400"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs uppercase tracking-widest text-ink-700/70"
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs uppercase tracking-widest text-ink-700/70"
              >
                Tell us about your day
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-400"
                placeholder="Date, location, and what you're dreaming of..."
              />
            </div>
            <button
              type="submit"
              disabled={mailtoTooLong}
              className="w-full rounded-full bg-ink-900 px-8 py-3 text-sm uppercase tracking-widest text-blush-50 transition-colors hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Enquiry
            </button>
            {mailtoTooLong ? (
              <p className="text-center text-xs text-blush-500">
                Your message is a little long to open in an email app. Please
                email us directly at{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="underline hover:text-gold-500"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            ) : (
              <p className="text-center text-xs text-ink-700/60">
                Opens your email app so you can send directly to us.
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
