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

function normalizeRole(role) {
  if (role === 'student') return 'student';
  if (role === 'mentor') return 'mentor';
  if (role === 'alumni_readonly') return 'alumni_readonly';
  return 'student';
}

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [identifierId, setIdentifierId] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    return isValidPassword(password) ? '' : 'Password must be at least 8 characters.';
  }, [password]);

  async function ensureProfileRow(supabase, user, profileInput = {}) {
    if (!user?.id) return;

    await supabase.from('users').upsert({
      id: user.id,
      username: `researcher-${user.id.slice(0, 8)}`,
      display_name: normalizeText(profileInput.fullName) || null,
      role: normalizeRole(profileInput.role),
      updated_at: new Date().toISOString()
    });
  }

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!isValidEmail(email)) {
      setLoading(false);
      setError('Enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setLoading(false);
      setError('Password must be at least 8 characters.');
      return;
    }

    const supabase = createClient();
    const cleanEmail = normalizeText(email);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: normalizeText(fullName),
            role: normalizeRole(role),
            identifier_id: normalizeText(identifierId),
            marketing_opt_in: marketingConsent
          }
        }
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      if (data?.user && data?.session) {
        await ensureProfileRow(supabase, data.user, {
          fullName,
          role
        });
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
    setError('');
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
          ? 'Register your details to access Preclore research tools.'
          : 'Sign in with your email and password.'}
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
                Role
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="field"
              >
                <option value="student">Student</option>
                <option value="mentor">Teacher / Mentor</option>
                <option value="alumni_readonly">Guest / Independent Viewer</option>
              </select>
            </div>

            {role !== 'alumni_readonly' ? (
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
                  {role === 'student' ? 'Student ID' : 'Mentor ID'}
                </label>
                <input
                  type="text"
                  value={identifierId}
                  onChange={(event) => setIdentifierId(event.target.value)}
                  className="field"
                  placeholder={role === 'student' ? 'e.g., STU-2026-001' : 'e.g., MTR-2026-999'}
                />
              </div>
            ) : null}
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
            placeholder="you@domain.com"
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
            placeholder="Minimum 8 characters"
          />
        </div>

        {passwordError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {passwordError}
          </div>
        ) : null}

        {isSignUp ? (
          <>
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="marketing"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-2 border-ink accent-ink"
              />
              <label htmlFor="marketing" className="text-xs leading-snug text-ink/80">
                I agree to receive updates, research roundups, and platform announcements regarding Preclore.
              </label>
            </div>

            <p className="mt-4 text-center text-xs text-ink/70">
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
          </>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <TactileButton
            type="submit"
            disabled={loading || Boolean(emailError) || Boolean(passwordError)}
            variant="primary"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </TactileButton>

          <TactileButton type="button" onClick={signOut} variant="ghost">
            Sign Out
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
          className="text-sm font-semibold underline hover:text-coral"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
