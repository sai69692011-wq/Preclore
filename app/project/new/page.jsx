import { redirect } from 'next/navigation';
import { deriveAccessProfile } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectNewPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?next=/project/new');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, birth_year')
    .eq('id', user.id)
    .maybeSingle();

  const access = deriveAccessProfile(profile || {});

  if (!access.canSubmit) {
    redirect('/journal?view=readonly');
  }

  redirect('/submit');
}
