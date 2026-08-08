'use client';

import { useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';

export default function ReportButton({ targetUserId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('fake_identity');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitReport() {
    setLoading(true);
    setMessage('');

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, reason, note })
    });

    const result = await response.json();
    setLoading(false);
    setMessage(result.error || result.message || 'Report sent.');

    if (response.ok) {
      setOpen(false);
      setNote('');
    }
  }

  return (
    <div className="space-y-3">
      <TactileButton type="button" variant="ghost" onClick={() => setOpen((v) => !v)}>
        Report this account
      </TactileButton>

      {open ? (
        <div className="rounded-2xl border-2 border-ink bg-paper p-4">
          <div className="text-sm font-black text-ink">Why are you reporting this account?</div>

          <select
            className="field mt-3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="fake_identity">Fake identity</option>
            <option value="fake_institution">Fake institution</option>
            <option value="fake_project_ownership">Fake project ownership</option>
            <option value="misleading_verification">Misleading verification</option>
            <option value="other">Other</option>
          </select>

          <textarea
            className="field mt-3 min-h-24"
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="mt-3 flex gap-3">
            <TactileButton type="button" variant="primary" onClick={submitReport} disabled={loading}>
              {loading ? 'Sending...' : 'Send Report'}
            </TactileButton>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-ink/75">{message}</p> : null}
    </div>
  );
}
