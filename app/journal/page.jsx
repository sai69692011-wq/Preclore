import JournalBrowser from '@/components/journal/journal-browser';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Global Research Journal — Preclore v2.4'
};

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.rpc('get_public_project_cards');

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Cream Paper Archive</div>
        <h1 className="mt-2 text-4xl font-black text-ink">Global Research Journal</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/80">
          A permanent, searchable record of student research. All work is published instantly by the autonomous deterministic VQ Engine.
        </p>
      </div>
      <JournalBrowser projects={projects || []} />
    </div>
  );
}
