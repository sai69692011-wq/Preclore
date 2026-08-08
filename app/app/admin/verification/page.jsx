'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import TactileButton from '@/components/ui/tactile-button';

export default function AdminVerificationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState('loading');
  const [items, setItems] = useState([]);
  const [flash, setFlash] = useState('');
  const [notes, setNotes] = useState({});

  useEffect(() => {
    async function load() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('not-signed-in');
        return;
      }

      const { data: me } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!me || me.role !== 'admin') {
        setStatus('forbidden');
        return;
      }

      const { data: rows, error } = await supabase
        .from('users')
        .select(
          'id, display_name, username, role, school_name, institution_name, institution_id_ref, verification_status, verification_score, verification_flags'
        )
        .in('verification_status', ['pending', 'needs_review', 'auto_checked'])
        .order('updated_at', { ascending: false });

      if (error) {
        setStatus('error');
        setFlash(error.message);
        return;
      }

      setItems(rows || []);
      setStatus('ready');
    }

    load();
  }, [supabase]);

  async function review(targetUserId, decision) {
    const response = await fetch('/api/admin/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId,
        decision,
        note: notes[targetUserId] || ''
      })
    });

    const result = await response.json();
    setFlash(result.error || result.message || 'Updated.');

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== targetUserId));
    }
  }

  if (status === 'loading') {
    return <div className="text-sm font-semibold text-ink">Loading verification queue...</div>;
  }

  if (status === 'not-signed-in') {
    return <div className="text-sm font-semibold text-ink">Please sign in as admin.</div>;
  }

  if (status === 'forbidden') {
    return <div className="text-sm font-semibold text-ink">You do not have access to this page.</div>;
  }

  if (status === 'error') {
    return <div className="text-sm font-semibold text-ink">{flash || 'Unable to load verification queue.'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Admin</div>
        <h1 className="mt-2 text-4xl font-black text-ink">Verification Queue</h1>
        <p className="mt-2 text-sm leading-7 text-ink/80">
          Review auto-checked or pending accounts and decide if they should become fully verified.
        </p>
      </div>

      {flash ? (
        <div className="rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
          {flash}
        </div>
      ) : null}

      <div className="grid gap-5">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]"
            >
              <div className="space-y-2 text-sm text-ink/80">
                <p><strong>Name:</strong> {item.display_name || item.username || item.id}</p>
                <p><strong>Role:</strong> {item.role}</p>
                <p><strong>Institution:</strong> {item.institution_name || item.school_name || 'Not set'}</p>
                <p><strong>ID Reference:</strong> {item.institution_id_ref || 'Not provided'}</p>
                <p><strong>Status:</strong> {item.verification_status}</p>
                <p><strong>Score:</strong> {item.verification_score ?? 0}</p>
                <p><strong>Flags:</strong> {Array.isArray(item.verification_flags) && item.verification_flags.length ? item.verification_flags.join(', ') : 'None'}</p>
              </div>

              <textarea
                className="field mt-4 min-h-24"
                placeholder="Optional admin note"
                value={notes[item.id] || ''}
                onChange={(e) =>
                  setNotes((current) => ({
                    ...current,
                    [item.id]: e.target.value
                  }))
                }
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <TactileButton onClick={() => review(item.id, 'approve')} variant="mint">
                  Approve
                </TactileButton>
                <TactileButton onClick={() => review(item.id, 'reject')} variant="secondary">
                  Reject
                </TactileButton>
                <TactileButton onClick={() => review(item.id, 'revoke')} variant="ghost">
                  Revoke
                </TactileButton>
                <TactileButton onClick={() => review(item.id, 'expired')} variant="ghost">
                  Mark Expired
                </TactileButton>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border-2 border-dashed border-ink/40 bg-white/70 p-8 text-sm text-ink/75">
            No accounts need verification review right now.
          </div>
        )}
      </div>
    </div>
  );
}
