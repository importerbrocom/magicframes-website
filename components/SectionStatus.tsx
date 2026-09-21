'use client';

// Shown in place of a gallery grid while content loads, when nothing has been
// added yet, or when the backend could not be reached.
//
// The last case matters: without it a misconfigured API renders a polished but
// completely empty site with no clue as to why, which is indistinguishable from
// "the owner hasn't added photos yet".

export type LoadState = 'loading' | 'ready' | 'error';

interface SectionStatusProps {
  state: LoadState;
  count: number;
  /** What this section holds, e.g. "photos". Used in the empty message. */
  noun: string;
}

export default function SectionStatus({ state, count, noun }: SectionStatusProps) {
  if (state === 'ready' && count > 0) return null;

  if (state === 'loading') {
    return (
      <p className="mt-14 text-center text-sm text-ink-700/50" role="status">
        Loading {noun}…
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-14 rounded-2xl border border-blush-200 bg-blush-50/60 px-6 py-8 text-center">
        <p className="font-serif text-lg text-ink-900">We couldn&apos;t load the {noun}</p>
        <p className="mt-2 text-sm text-ink-700/70">
          Please refresh the page, or get in touch with us directly if this keeps happening.
        </p>
      </div>
    );
  }

  return (
    <p className="mt-14 text-center text-sm text-ink-700/50">
      No {noun} yet — please check back soon.
    </p>
  );
}
