'use client';

import { useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';

export default function FollowRequestButton({ researcherId }) {
  const [state, setState] = useState({ loading: false, message: '' });

  async function sendRequest() {
    setState({ loading: true, message: '' });
    const response = await fetch('/api/mentorship-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ researcherId })
    });
    const result = await response.json();

    setState({
      loading: false,
      message: result.error || result.message || 'Follow request sent.'
    });
  }

  return (
    <div className="space-y-3">
      <TactileButton onClick={sendRequest} disabled={state.loading} variant="lilac">
        {state.loading ? 'Sending...' : 'Request Mentor Access'}
      </TactileButton>
      {state.message ? <p className="text-sm text-ink/75">{state.message}</p> : null}
    </div>
  );
}
