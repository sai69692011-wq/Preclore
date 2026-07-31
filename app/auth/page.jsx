'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/browser';
import { normalizeText } from '@/lib/utils';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

function isValidPassword(password) {
  return String(password || '').length >= 8;
}

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    return isValidPassword(password) ? '' : 'Password must be at least 8 characters.';
  }, [password]);

  async function ensureProfileRow(supabase, user) {
    if (!user?.id) return;

    await supabase.from('users').upsert({
      id: user.id,
      username: `researcher-${user.id.slice(0, 8)}`,
      updated_at: new Date().toISOString()
    });
  }

  async function handleAuth(event) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const cleanEmail = normalizeText(email);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password
      });

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      if (data?.user && data?.session) {
        await ensureProfileRow(supabase, data.user);
        setLoading(false);
        router.push('/profile');
        router.refresh();
        return;
      }

      setLoading(false);
      setMessage('Account created successfully. You can now sign in.');
      setIsSignUp(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    if (data?.user) {
      await ensureProfileRow(supabase, data.user);
    }

    setLoading(false);
    router.push('/profile');
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage('Signed out.');
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        Supabase Auth
      </div>

      <h1 className="mt-3 text-4xl font-black text-ink">
        {isSignUp ? 'Create your account' : 'Sign in'}
      </h1>

      <p className="mt-3 text-sm leading-7 text-ink/80">
        {isSignUp
          ? 'Create your Preclore account with email and password.'
          : 'Sign in with your email and password to access your profile and research tools.'}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleAuth}>
        <input
          className="field"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {emailError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {emailError}
          </div>
        ) : null}

        <input
          className="field"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {passwordError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {passwordError}
          </div>
        ) : null}

        {isSignUp ? (
          <p className="mt-4 text-xs text-center text-ink/70">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline font-semibold hover:text-coral">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline font-semibold hover:text-coral">
              Privacy Policy
            </Link>
            .
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <TactileButton
            type="submit"
            disabled={loading || Boolean(emailError) || Boolean(passwordError) || !email || !password}
            variant="primary"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </TactileButton>

          <TactileButton type="button" onClick={signOut} variant="ghost">
            Sign Out
          </TactileButton>
        </div>
      </form>

      <div className="mt-5">
        <button
          type="button"
          className="text-sm font-semibold text-ink/75 underline"
          onClick={() => {
            setIsSignUp((current) => !current);
            setMessage('');
          }}
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
          {message}
        </div>
      ) : null}
    </div>
  );
}
