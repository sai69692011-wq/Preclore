'use client';

import { useMemo, useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/browser';
import { normalizeText } from '@/lib/utils';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Enter a valid email address.';
  }, [email]);

  async function signIn(event) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get('next') || '/profile';
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', nextPath);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeText(email),
      options: {
        emailRedirectTo: callbackUrl.toString()
      }
    });

    setLoading(false);
    setMessage(error ? error.message : 'Check your email for the sign-in link.');
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage('Signed out.');
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Supabase Auth</div>
      <h1 className="mt-3 text-4xl font-black text-ink">Sign in with magic link</h1>
      <p className="mt-3 text-sm leading-7 text-ink/80">Use email OTP to create your researcher identity, submit quests, and manage connections.</p>
      <form className="mt-6 space-y-4" onSubmit={signIn}>
        <input className="field" placeholder="name@example.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {emailError ? <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">{emailError}</div> : null}
        <div className="flex flex-wrap gap-3">
          <TactileButton type="submit" disabled={loading || Boolean(emailError) || !email} variant="primary">{loading ? 'Sending...' : 'Send Magic Link'}</TactileButton>
          <TactileButton type="button" onClick={signOut} variant="ghost">Sign Out</TactileButton>
        </div>
      </form>
      {message ? <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">{message}</div> : null}
    </div>
  );
}
