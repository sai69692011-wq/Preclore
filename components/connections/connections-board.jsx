'use client';

import { useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';

function RequestCard({ request, canRespond, onRespond }) {
  return (
    <article className="rounded-[24px] border-2 border-ink bg-white/75 p-5 shadow-[0_4px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-forest">{request.status}</div>
      <h3 className="mt-2 text-lg font-black text-ink">{request.requester_name} → {request.researcher_name}</h3>
      <p className="mt-2 text-sm text-ink/75">Created {new Date(request.created_at).toLocaleString()}</p>
      {canRespond && request.status === 'pending' ? (
        <div className="mt-4 flex gap-3">
          <TactileButton onClick={() => onRespond(request.id, 'accepted')} variant="mint">Accept</TactileButton>
          <TactileButton onClick={() => onRespond(request.id, 'rejected')} variant="secondary">Reject</TactileButton>
        </div>
      ) : null}
    </article>
  );
}

export default function ConnectionsBoard({ incoming, outgoing }) {
  const [flash, setFlash] = useState('');

  async function handleRespond(requestId, status) {
    const response = await fetch('/api/mentorship-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status })
    });
    const result = await response.json();
    setFlash(result.error || result.message || 'Updated request. Refresh to see latest state.');
  }

  return (
    <div className="space-y-8">
      {flash ? <div className="rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">{flash}</div> : null}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-ink">Incoming follow requests</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {incoming.length ? incoming.map((request) => (
            <RequestCard key={request.id} request={request} canRespond onRespond={handleRespond} />
          )) : <div className="rounded-[24px] border-2 border-dashed border-ink/40 bg-white/60 p-6 text-sm text-ink/70">No incoming requests yet.</div>}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-ink">Outgoing requests</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {outgoing.length ? outgoing.map((request) => (
            <RequestCard key={request.id} request={request} canRespond={false} onRespond={handleRespond} />
          )) : <div className="rounded-[24px] border-2 border-dashed border-ink/40 bg-white/60 p-6 text-sm text-ink/70">No outgoing requests yet.</div>}
        </div>
      </section>
    </div>
  );
}
