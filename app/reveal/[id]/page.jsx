import { notFound } from 'next/navigation';
import TierBadge from '@/components/ui/tier-badge';
import ShimmerProgress from '@/components/ui/shimmer-progress';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';

export default async function RevealPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, title, vq_score, tier, vq_breakdown, project_tag')
    .eq('id', id)
    .single();

  if (!project) {
    notFound();
  }

  const breakdown = project.vq_breakdown || {};

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border-2 border-ink bg-white/80 p-8 text-center shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.35em] text-forest">VQ Reveal</div>
        <h1 className="mt-3 text-5xl font-black text-ink">{project.title}</h1>
        <p className="mt-4 text-lg text-ink/75">Published instantly under the <strong>{project.project_tag}</strong> registry tag.</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <TierBadge tier={project.tier} className="text-lg" />
          <div className="rounded-full border-2 border-ink bg-butter px-6 py-3 text-2xl font-black text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)]">
            VQ Score: {project.vq_score}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {Object.entries({
          Foundation: breakdown.foundation || 0,
          Clarity: breakdown.clarity || 0,
          Evidence: breakdown.evidence || 0,
          Systems: breakdown.systems || 0,
          PublicGood: breakdown.publicGood || 0
        }).map(([label, value]) => (
          <div key={label} className="rounded-[28px] border-2 border-ink bg-white/75 p-5 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-forest">{label}</div>
            <ShimmerProgress value={value * 5} />
            <div className="mt-3 text-sm font-semibold text-ink/80">{value} / 20</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <TactileButton href={`/project/${project.slug}`} variant="primary">Open Project Page</TactileButton>
        <TactileButton href="/journal" variant="secondary">Back to Journal</TactileButton>
      </div>
    </div>
  );
}
