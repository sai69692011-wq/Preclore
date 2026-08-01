import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile/profile-form';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <ProfileForm initialProfile={profile || {}} />
    </div>
  );
}
