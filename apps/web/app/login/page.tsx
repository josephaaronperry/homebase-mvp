'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message ?? 'Login failed');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(redirectTo);
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    setError('');
    try {
      const callbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
          : undefined;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });

      if (oauthError) {
        setError(oauthError.message ?? 'Google sign-in failed');
        setOauthLoading(false);
      }
    } catch {
      setError('Google sign-in failed');
      setOauthLoading(false);
    }
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
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to access your dashboard, saved homes, and offers.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-50 hover:border-emerald-400 disabled:opacity-70"
        >
          <span className="h-4 w-4 rounded-full bg-slate-700" />
          {oauthLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          <span>or sign in with email</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-200">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-500/60"
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-500/60"
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link
              href="/forgot-password"
              className="text-slate-400 hover:text-slate-200"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          No account?{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
