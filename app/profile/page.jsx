import ProfileForm from '@/components/profile/profile-form';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-[30px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <h1 className="text-3xl font-black text-ink">Profile</h1>
        <p className="mt-3 text-sm leading-7 text-ink/80">Sign in to set your public researcher card and parental buffer UPI ID.</p>
        <div className="mt-5"><TactileButton href="/auth" variant="primary">Go to Auth</TactileButton></div>
      </div>
    );
  }

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

  return <ProfileForm initialProfile={profile} />;
}
