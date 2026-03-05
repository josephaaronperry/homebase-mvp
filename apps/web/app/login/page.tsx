'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

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
    console.log('[Login] handleSubmit fired', { email: form.email, redirectTo });
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(signInError.message ?? 'Login failed');
        setLoading(false);
        return;
      }

      setLoading(false);
      // Refresh so the server (middleware) sees the new session cookies, then navigate
      router.refresh();
      router.push(redirectTo || '/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    setError('');
    try {
      const callbackUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
          : undefined;

      const { error: oauthError } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });

      if (oauthError) {
        setError(oauthError.message ?? 'Google sign-in failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 items-center justify-center bg-[#FAFAF8]">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-[#52B788]">
            HomeBase
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1A1A1A]">
            Welcome back.
          </h1>
          <p className="mt-1 text-sm text-[#4A4A4A]">
            Sign in to access your dashboard, saved homes, and offers.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={oauthLoading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E6E1] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:border-[#1B4332] disabled:opacity-70"
        >
          <span className="h-4 w-4 rounded-full bg-[#E8E6E1]" />
          {oauthLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="mb-4 flex items-center gap-2 text-[11px] text-[#4A4A4A]">
          <div className="h-px flex-1 bg-[#E8E6E1]" />
          <span>or sign in with email</span>
          <div className="h-px flex-1 bg-[#E8E6E1]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">Email</label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">Password</label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-[#4A4A4A] hover:text-[#1A1A1A]">Forgot password?</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2D5A47] disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-[#4A4A4A]">
          No account? <Link href="/register" className="font-semibold text-[#52B788] hover:text-[#1B4332]">Create one</Link>
        </p>
      </div>
    </div>
  );
}
