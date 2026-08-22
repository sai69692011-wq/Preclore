import ConnectionsBoard from '@/components/connections/connections-board';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-[30px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <h1 className="text-3xl font-black text-ink">Requests</h1>
        <p className="mt-3 text-sm leading-7 text-ink/80">
          Create your account first, or login to manage contact requests.
        </p>
        <div className="mt-5">
          <TactileButton href="/auth" variant="primary">
            Create / Login
          </TactileButton>
        </div>
      </div>
    );
  }

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabase.from('mentorship_requests').select('*').eq('researcher_id', user.id).order('created_at', { ascending: false }),
    supabase.from('mentorship_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Trusted Access</div>
        <h1 className="mt-2 text-4xl font-black text-ink">Requests and safe contact</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/80">
          Approve requests only when you want to share access.
        </p>
      </div>
      <ConnectionsBoard incoming={incoming || []} outgoing={outgoing || []} />
    </div>
  );
}
