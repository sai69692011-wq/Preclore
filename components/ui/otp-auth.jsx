'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/browser';
import { normalizeText } from '@/lib/utils';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(email));
}

export default function OtpAuth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
        shouldCreateUser: true
      }
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setStep('verify');
    setOtp('');
    setTimer(30);
    setMessage('OTP sent. Enter the 6-digit code from your email.');
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
      setMessage(error.message);
      return;
    }

    router.push('/profile');
  }

  return (
    <div className="mx-auto max-w-2xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Supabase OTP Auth</div>
      <h1 className="mt-3 text-4xl font-black text-ink">
        {step === 'email' ? 'Sign in with email OTP' : 'Verify your code'}
      </h1>
      <p className="mt-3 text-sm leading-7 text-ink/80">
        {step === 'email'
          ? 'Enter your email to receive a 6-digit verification code.'
          : `Enter the 6-digit code sent to ${email}.`}
      </p>

      {step === 'email' ? (
        <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
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
            {loading ? 'Sending...' : 'Send Code'}
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
              {loading ? 'Verifying...' : 'Verify Code'}
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
