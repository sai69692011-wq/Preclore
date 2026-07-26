import { redirect } from 'next/navigation';
import SubmitQuest from '@/components/quest/submit-quest';
import { deriveAccessProfile } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Quest Submission — Preclore v2.4'
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let access = null;

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
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Minimalist Game Flow</div>
        <h1 className="mt-2 text-4xl font-black text-ink">Launch your 8-step research quest</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/80">
          Students choose a project tag, describe their systems research, attach evidence, and publish instantly.
        </p>
      </div>
      <SubmitQuest isAuthenticated={Boolean(user)} />
    </div>
  );
}
