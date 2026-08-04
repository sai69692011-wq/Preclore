'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

function normalizeRole(role) {
  if (role === 'student') return 'student';
  if (role === 'alumni_readonly') return 'alumni_readonly';
  return 'student';
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Please enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    return isValidPassword(password) ? '' : 'Please use at least 8 characters for your password.';
  }, [password]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setCurrentUser(session?.user ?? null);
      setCheckingSession(false);
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function ensureProfileRow(user, profileInput = {}) {
    if (!user?.id) return;

    const payload = {
      id: user.id,
      username: `researcher-${user.id.slice(0, 8)}`,
      updated_at: new Date().toISOString()
    };

    if (profileInput.fullName !== undefined) {
      payload.display_name = normalizeText(profileInput.fullName) || null;
    }

    if (profileInput.role !== undefined) {
      payload.role = normalizeRole(profileInput.role);
    }

    await supabase.from('users').upsert(payload);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!isValidEmail(email)) {
      setLoading(false);
      setError('Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setLoading(false);
      setError('Please use at least 8 characters for your password.');
      return;
    }

    const cleanEmail = normalizeText(email);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: normalizeText(fullName),
            role: normalizeRole(role)
          }
        }
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      if (data?.user && data?.session) {
        await ensureProfileRow(data.user, { fullName, role });
        setLoading(false);
        router.push('/profile');
        router.refresh();
        return;
      }

      setLoading(false);
      setMessage('Your account has been created. You can now sign in.');
      setIsSignUp(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    if (data?.user) {
      await ensureProfileRow(data.user);
    }

    setLoading(false);
    router.push('/profile');
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMessage('Signed out successfully.');
    setError('');
  }

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <p className="text-sm font-semibold text-ink">Checking your session...</p>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
          Signed In
        </div>

        <h1 className="mt-3 text-4xl font-black text-ink">You are already signed in</h1>
        <p className="mt-2 break-all text-sm text-ink/80">{currentUser.email}</p>

        {message ? (
          <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <TactileButton onClick={() => router.push('/profile')} variant="primary">
            Go to Profile
          </TactileButton>
          <TactileButton onClick={signOut} variant="ghost">
            Sign Out
          </TactileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        Account
      </div>

      <h1 className="mt-3 text-4xl font-black text-ink">
        {isSignUp ? 'Create your account' : 'Log in'}
      </h1>

      <p className="mt-3 text-sm leading-7 text-ink/80">
        {isSignUp
          ? 'Use your email and create any password you want for Preclore.'
          : 'Enter your email and the password you created for Preclore.'}
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
        {isSignUp ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required={isSignUp}
                className="field"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
                Account Type
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="field"
              >
                <option value="student">Student</option>
                <option value="alumni_readonly">Guest / Viewer</option>
              </select>
            </div>
          </>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="field"
            placeholder="you@example.com"
          />
        </div>

        {emailError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {emailError}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="field"
            placeholder="Create any password you want"
          />
        </div>

        <p className="text-xs text-ink/70">
          This is your <strong>Preclore password</strong>. It does <strong>not</strong> need to be your email account password.
        </p>

        {passwordError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {passwordError}
          </div>
        ) : null}

        {isSignUp ? (
          <p className="mt-4 text-center text-xs text-ink/70">
            By signing up, you agree to our{' '}
            <Link
              href="/terms"
              className="font-semibold underline transition-opacity hover:opacity-80"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-semibold underline transition-opacity hover:opacity-80"
            >
              Privacy Policy
            </Link>
            .
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <TactileButton
            type="submit"
            disabled={loading || Boolean(emailError) || Boolean(passwordError)}
            variant="primary"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
          </TactileButton>
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
          }}
          className="text-sm font-semibold underline transition-opacity hover:opacity-80"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
