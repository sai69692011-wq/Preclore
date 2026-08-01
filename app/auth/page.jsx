'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/browser';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`
        }
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage('Check your email for the confirmation link!');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      setLoading(false);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push('/profile');
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </div>

      <h1 className="mt-3 text-3xl font-black text-ink">
        {isSignUp ? 'Join Preclore' : 'Sign In'}
      </h1>
      <p className="mt-2 text-sm text-ink/80">
        {isSignUp
          ? 'Register to start submitting and tracking research quests.'
          : 'Access your profile and managed research entries.'}
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleAuth} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="pt-2">
          <TactileButton type="submit" disabled={loading} variant="primary">
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </TactileButton>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-bold text-forest underline hover:text-ink"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
