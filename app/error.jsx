'use client';

import { useEffect } from 'react';
import TactileButton from '@/components/ui/tactile-button';

export default function GlobalRouteError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Recovery Mode</div>
      <h1 className="mt-3 text-4xl font-black text-ink">Something went wrong in this view</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/80">
        A rendering or data issue was caught before the full interface crashed. You can retry this view or go back to the journal safely.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <TactileButton onClick={() => reset()} variant="primary">Retry View</TactileButton>
        <TactileButton href="/journal" variant="secondary">Go to Journal</TactileButton>
      </div>
    </div>
  );
}
