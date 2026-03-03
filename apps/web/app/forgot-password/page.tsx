'use client';

import { useState } from 'react';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message ?? 'Failed to send reset email');
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400"
          >
            HomeBase
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-50">
            Forgot password
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your email and we&apos;ll send you a secure reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
            Check your email for a reset link. Follow the instructions there to
            choose a new password.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-200">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-500/60"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-70"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Go back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

