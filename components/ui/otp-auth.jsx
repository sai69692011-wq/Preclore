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
  if (role === 'teacher_reviewer') return 'mentor';
  if (role === 'guest_viewer') return 'alumni_readonly';
  return 'student';
}

function simplifyAuthError(message = '') {
  const lower = String(message).toLowerCase();

  if (
    lower.includes('password should contain') ||
    lower.includes('uppercase') ||
    lower.includes('lowercase') ||
    lower.includes('special character') ||
    lower.includes('number')
  ) {
    return 'Your password is being blocked by Supabase password rules. Please relax those rules in Supabase if you only want a simple password.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'That email or password does not match. Please try again.';
  }

  if (lower.includes('user already registered')) {
    return 'This email already has an account. Please use Login.';
  }

  return message || 'Something went wrong. Please try again.';
}

export default function OtpAuth() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Please enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    return isValidPassword(password) ? '' : 'Please use at least 8 characters.';
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

    if (profileInput.schoolName !== undefined) {
      payload.school_name = normalizeText(profileInput.schoolName) || null;
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
    setFormError('');

    if (!isValidEmail(email)) {
      setLoading(false);
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setLoading(false);
      setFormError('Please use at least 8 characters for your password.');
      return;
    }

    const cleanEmail = normalizeText(email);

    if (isSignUp) {
      if (!normalizeText(fullName)) {
        setLoading(false);
        setFormError('Please enter your full name.');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: normalizeText(fullName),
            school_name: normalizeText(schoolName),
            role: normalizeRole(role)
          }
        }
      });

      if (signUpError) {
        setLoading(false);
        setFormError(simplifyAuthError(signUpError.message));
        return;
      }

      if (data?.user) {
        await ensureProfileRow(data.user, { fullName, schoolName, role });
      }

      setLoading(false);

      if (data?.session) {
        router.push('/profile');
        router.refresh();
        return;
      }

      setMessage(
        'Your account has been created. If email confirmation is enabled in Supabase, please confirm your email first, then log in.'
      );
      setIsSignUp(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (signInError) {
      setLoading(false);
      setFormError(simplifyAuthError(signInError.message));
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
    setFormError('');
  }

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-2xl rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
        <p className="text-sm font-semibold text-ink">Checking your session...</p>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="mx-auto max-w-2xl rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
          Signed In
        </div>

        <h1 className="mt-3 text-3xl font-black text-ink">You are already logged in</h1>
        <p className="mt-2 break-all text-sm text-ink/80">{currentUser.email}</p>

        {message ? (
          <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <TactileButton onClick={() => router.push('/profile')} variant="primary">
            Go to My Profile
          </TactileButton>
          <TactileButton onClick={signOut} variant="ghost">
            Sign Out
          </TactileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        Create Account / Login
      </div>

      <h1 className="mt-3 text-3xl font-black text-ink">
        {isSignUp ? 'Create your account' : 'Login to your account'}
      </h1>

      <p className="mt-3 text-sm leading-7 text-ink/80">
        {isSignUp
          ? 'New here? Create your account first with your email, your own Preclore password, and a few basic details.'
          : 'Already have an account? Log in with the email and password you created for Preclore.'}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setFormError('');
            setMessage('');
          }}
          className={`rounded-[24px] border-2 p-4 text-left transition ${
            isSignUp
              ? 'border-ink bg-mint shadow-[0_4px_0_0_rgba(44,43,42,1)]'
              : 'border-ink/40 bg-white'
          }`}
        >
          <div className="text-lg font-black text-ink">Create Account</div>
          <div className="mt-1 text-sm leading-6 text-ink/75">I am new here.</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setFormError('');
            setMessage('');
          }}
          className={`rounded-[24px] border-2 p-4 text-left transition ${
            !isSignUp
              ? 'border-ink bg-butter shadow-[0_4px_0_0_rgba(44,43,42,1)]'
              : 'border-ink/40 bg-white'
          }`}
        >
          <div className="text-lg font-black text-ink">Login</div>
          <div className="mt-1 text-sm leading-6 text-ink/75">I already have an account.</div>
        </button>
      </div>

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
                School / Organization
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                className="field"
                placeholder="School / College / NGO / Organization"
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
                <option value="teacher_reviewer">Teacher / Reviewer / NGO</option>
                <option value="guest_viewer">Guest / Viewer</option>
              </select>
            </div>

            <p className="text-xs text-ink/70">
              Student accounts can post projects. Teacher, reviewer, NGO, and guest accounts can browse and connect, but they do not get student posting tools.
            </p>
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

        {formError ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {formError}
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
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
          </TactileButton>
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setFormError('');
            setMessage('');
          }}
          className="text-sm font-semibold underline transition-opacity hover:opacity-80"
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
