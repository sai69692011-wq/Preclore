'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/browser';
import { normalizeText } from '@/lib/utils';

const AUTH_MODES = {
  create: {
    title: 'Create your account',
    label: 'Create Account',
    description: 'New here? Create your account first. We will send a 6-digit code to your email.',
    emailHint: 'Use an email you can open right now.',
    submitLabel: 'Send Code for Create Account'
  },
  login: {
    title: 'Login to your account',
    label: 'Login',
    description: 'Already have an account? Use the same email and login here.',
    emailHint: 'Use the email already linked to your account.',
    submitLabel: 'Send Code for Login'
  }
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

function getFriendlyAuthError(message, mode) {
  const text = normalizeText(message).toLowerCase();

  if (!text) {
    return 'Something went wrong. Please try again.';
  }

  if (text.includes('signups not allowed')) {
    return mode === 'login'
      ? 'This email does not have an account yet. Use Create Account first.'
      : 'New account creation is turned off right now.';
  }

  if (text.includes('invalid login credentials')) {
    return mode === 'login'
      ? 'That email could not be logged in. Check the email or use Create Account first.'
      : 'That email could not be used right now. Please try again.';
  }

  if (text.includes('otp') || text.includes('token') || text.includes('expired')) {
    return 'That code is wrong or expired. Please try again or resend the code.';
  }

  return message;
}

export default function OtpAuth() {
  const router = useRouter();
  const [mode, setMode] = useState('create');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentMode = AUTH_MODES[mode];
  const canResend = step === 'verify' && timer === 0;
  const emailError = useMemo(() => {
    if (!email) return '';
    return isValidEmail(email) ? '' : 'Enter a valid email address.';
  }, [email]);

  useEffect(() => {
    if (step !== 'verify' || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  async function handleSendOtp(event) {
    event?.preventDefault();

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeText(email),
      options: {
        shouldCreateUser: mode === 'create'
      }
    });

    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message, mode));
      return;
    }

    setStep('verify');
    setOtp('');
    setTimer(30);
    setMessage(`Code sent to ${normalizeText(email)}. Enter the 6-digit code from your email.`);
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      setMessage('Enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: normalizeText(email),
      token: cleanOtp,
      type: 'email'
    });

    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message, mode));
      return;
    }

    router.push('/profile');
  }

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setMessage('');

    if (step === 'verify') {
      setStep('email');
      setOtp('');
      setTimer(30);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Create Account First</div>

      <h1 className="mt-3 text-4xl font-black text-ink">
        {step === 'email' ? 'Create account or login' : 'Enter your code'}
      </h1>

      <p className="mt-3 text-sm leading-7 text-ink/80">
        {step === 'email'
          ? 'If you are new, use Create Account first. If you already joined before, use Login.'
          : `Enter the 6-digit code sent to ${normalizeText(email)}.`}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleModeChange('create')}
          className={`rounded-[24px] border-2 p-4 text-left transition ${
            mode === 'create' ? 'border-ink bg-mint shadow-[0_4px_0_0_rgba(44,43,42,1)]' : 'border-ink/50 bg-white'
          }`}
        >
          <div className="text-lg font-black text-ink">Create Account</div>
          <div className="mt-1 text-sm leading-6 text-ink/75">I am new here.</div>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('login')}
          className={`rounded-[24px] border-2 p-4 text-left transition ${
            mode === 'login' ? 'border-ink bg-butter shadow-[0_4px_0_0_rgba(44,43,42,1)]' : 'border-ink/50 bg-white'
          }`}
        >
          <div className="text-lg font-black text-ink">Login</div>
          <div className="mt-1 text-sm leading-6 text-ink/75">I already have an account.</div>
        </button>
      </div>

      {step === 'email' ? (
        <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
          <div className="rounded-[24px] border-2 border-ink bg-paper p-4">
            <div className="text-sm font-bold text-ink">{currentMode.title}</div>
            <div className="mt-1 text-sm leading-6 text-ink/75">{currentMode.emailHint}</div>
          </div>

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

          <TactileButton type="submit" disabled={loading || Boolean(emailError) || !email} variant="primary">
            {loading ? 'Sending...' : currentMode.submitLabel}
          </TactileButton>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp}>
          <input
            className="field text-center text-lg tracking-[0.4em]"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          <div className="flex flex-wrap gap-3">
            <TactileButton type="submit" disabled={loading || otp.length !== 6} variant="primary">
              {loading ? 'Checking...' : mode === 'create' ? 'Create Account' : 'Login'}
            </TactileButton>

            <TactileButton
              type="button"
              disabled={!canResend || loading}
              onClick={handleSendOtp}
              variant="secondary"
            >
              {canResend ? 'Resend Code' : `Resend in ${timer}s`}
            </TactileButton>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-ink/70 underline"
            onClick={() => {
              setStep('email');
              setOtp('');
              setMessage('');
            }}
          >
            Change email
          </button>
        </form>
      )}

      {message ? (
        <div className="mt-4 rounded-2xl border-2 border-ink bg-butter p-3 text-sm font-semibold text-ink">
          {message}
        </div>
      ) : null}
    </div>
  );
}
