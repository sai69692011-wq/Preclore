import { redirect } from 'next/navigation';
import SubmitQuest from '@/components/quest/submit-quest';
import { deriveAccessProfile } from '@/lib/access';
import { PROJECT_SLOT_LIMIT } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Add Project — Preclore'
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let access = null;
  let activeProjectCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, birth_year')
      .eq('id', user.id)
      .maybeSingle();

    access = deriveAccessProfile(profile || {});

    if (!access.canSubmit) {
      redirect('/journal?view=readonly');
    }

    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('researcher_id', user.id)
      .eq('status', 'published');

    activeProjectCount = count || 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Add Project</div>
        <h1 className="mt-2 text-4xl font-black text-ink">Share your project online</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/80">
          Keep your project visible after the exhibition ends. Each student can keep up to {PROJECT_SLOT_LIMIT} live projects at a time.
        </p>
      </div>
      <SubmitQuest isAuthenticated={Boolean(user)} activeProjectCount={activeProjectCount} />
    </div>
  );
}
