'use client';

import { useEffect, useState } from 'react';

const hints = [
  'Using the right project type helps teachers, reviewers, and NGOs find your project faster.',
  'A short clear description makes your project easier to discover.',
  'Public Drive or Docs links work best when “Anyone with the link can view” is enabled.',
  'Good proof links can improve trust and VQ score.',
  'Verified badges help people trust the profile behind a project.',
  'Students always stay in control of who can contact them.',
  'Projects can be small ideas too — they do not need to be exhibition-ready.',
  'A strong title makes your project easier to remember.',
  'You can publish with just the basics and improve the project later.',
  'Simple summaries often work better than long complicated explanations.'
];

export default function PageLoader({ title = 'Loading Preclore...' }) {
  const [hint, setHint] = useState(hints[0]);

  useEffect(() => {
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    setHint(randomHint);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[32px] border-2 border-ink bg-paper p-6 text-center shadow-[0_8px_0_0_rgba(44,43,42,1)] sm:p-8">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink bg-white shadow-[0_6px_0_0_rgba(44,43,42,1)]">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-ink border-t-coral border-r-mint"></div>
            <div className="absolute inset-3 rounded-full border-2 border-dashed border-ink/40"></div>
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral"></div>
          </div>
        </div>

        <div className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-forest">
          Preclore is loading
        </div>

        <h2 className="text-2xl font-black text-ink sm:text-3xl">
          {title}
        </h2>

        <p className="mt-4 text-sm leading-7 text-ink/80 sm:text-base">
          {hint}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="h-3 w-3 animate-bounce rounded-full bg-coral [animation-delay:-0.3s]"></span>
          <span className="h-3 w-3 animate-bounce rounded-full bg-mint [animation-delay:-0.15s]"></span>
          <span className="h-3 w-3 animate-bounce rounded-full bg-butter"></span>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-ink/20 bg-white/70 p-4 text-left text-xs leading-6 text-ink/70 sm:text-sm">
          <div className="font-black text-ink">While you wait:</div>
          <ul className="mt-2 list-disc pl-5">
            <li>Keep project titles simple and clear.</li>
            <li>Use public links for files so others can open them easily.</li>
            <li>Students can choose who gets contact access.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
