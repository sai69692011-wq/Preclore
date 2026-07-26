import TactileButton from '@/components/ui/tactile-button';
import TierBadge from '@/components/ui/tier-badge';
import ShimmerProgress from '@/components/ui/shimmer-progress';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[36px] border-2 border-ink bg-white/75 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
          <div className="inline-flex rounded-full border-2 border-ink bg-mint px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-forest">
            Public Good • Registry-First • Instant VQ
          </div>
          <h1 className="mt-5 text-5xl font-black leading-tight text-ink">Preclore rebuilt as a playful registry for systems-minded student research.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink/80">
            Submit research through an 8-step quest, get scored instantly by a deterministic JavaScript VQ Engine,
            unlock a tier badge, and preserve the work forever in the Global Research Journal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TactileButton href="/submit" variant="primary">Start the Quest</TactileButton>
            <TactileButton href="/journal" variant="secondary">Browse the Journal</TactileButton>
            <TactileButton href="/support" variant="lilac">Support the Mission</TactileButton>
          </div>
        </div>
        <div className="float-card rounded-[36px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Unlock loop</div>
          <div className="mt-4 space-y-5">
            <ShimmerProgress value={87} label="Quest Energy" />
            <div className="grid gap-3">
              <TierBadge tier="Bronze" />
              <TierBadge tier="Silver" />
              <TierBadge tier="Gold" />
              <TierBadge tier="Platinum" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ['1. Quest', 'Students publish through an 8-step interactive submission flow with tactile controls and instant scoring.'],
          ['2. Reveal', 'The VQ Reveal screen announces score and badge without waiting for human review.'],
          ['3. Registry', 'All published work lands in the cream-paper Global Research Journal for long-term discovery.']
        ].map(([title, body]) => (
          <div key={title} className="rounded-[28px] border-2 border-ink bg-white/70 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
            <h2 className="text-2xl font-black text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/80">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[34px] border-2 border-ink bg-paper p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">What changed in v2.4</div>
            <h2 className="mt-3 text-3xl font-black text-ink">Registry-first. Voluntary mission support. Direct researcher routing.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/80">
              Preclore now acts as a public-good registry only. The platform can accept voluntary mission support for server continuity,
              while verified mentor/admin supporters can route eligible project support directly to a family-managed parental buffer UPI after acceptance.
            </p>
          </div>
          <div className="rounded-[28px] border-2 border-ink bg-white/80 p-6">
            <ul className="space-y-3 text-sm leading-6 text-ink/80">
              <li>• No mandatory pricing flows.</li>
              <li>• Deterministic Pure JS VQ Engine.</li>
              <li>• Searchable Global Research Journal.</li>
              <li>• RLS-protected parent UPI IDs until accepted mentor/admin access.</li>
              <li>• Vercel + Supabase friendly repo layout.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
