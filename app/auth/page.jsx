'id': 'auth-page',
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student'); // 'student', 'teacher', or 'guest'
  const [identifierId, setIdentifierId] = useState(''); // Student ID or Teacher ID
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (isSignUp) {
      // Sign Up flow with profile metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            identifier_id: identifierId,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Account created successfully! Check your email to confirm if required, or sign in.');
      }
    } else {
      // Sign In flow
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage('Signed in successfully!');
        window.location.href = '/profile';
      }
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border-2 border-ink bg-paper shadow-[4px_4px_0px_0px_#000]">
      <h1 className="text-2xl font-black uppercase tracking-wider mb-2">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h1>
      <p className="text-sm text-ink/75 mb-6">
        {isSignUp 
          ? 'Register your details to access Preclore research tools.' 
          : 'Sign in with your email and password.'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-coral/10 border border-coral text-coral text-sm font-semibold">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-forest/10 border border-forest text-forest text-sm font-semibold">
          {message}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
                className="w-full p-2 border-2 border-ink bg-paper text-ink"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border-2 border-ink bg-paper text-ink"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="guest">Guest / Independent Viewer</option>
              </select>
            </div>

            {role !== 'guest' && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  {role === 'student' ? 'Student ID' : 'Teacher ID'}
                </label>
                <input
                  type="text"
                  value={identifierId}
                  onChange={(e) => setIdentifierId(e.target.value)}
                  className="w-full p-2 border-2 border-ink bg-paper text-ink"
                  placeholder={role === 'student' ? 'e.g., STU-2026-001' : 'e.g., TCH-2026-999'}
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border-2 border-ink bg-paper text-ink"
            placeholder="you@domain.com"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border-2 border-ink bg-paper text-ink"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-ink text-paper font-black uppercase tracking-wider border-2 border-ink hover:bg-forest transition-colors"
        >
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="text-sm font-semibold underline hover:text-coral"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
