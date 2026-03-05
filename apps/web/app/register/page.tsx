'use client';

import { useState } from 'react';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Email is required.';
  if (trimmed.length > 254) return 'Email is too long.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address (e.g. you@example.com).';
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) return 'Please enter a valid email address.';
  return null;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const emailError = validateEmail(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

      const { error: signUpError } = await getSupabaseClient().auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: form.fullName,
            phone: form.phone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message ?? 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 items-center justify-center bg-[#FAFAF8]">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-[#52B788]"
          >
            HomeBase
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1A1A1A]">
            Create your account.
          </h1>
          <p className="mt-1 text-sm text-[#4A4A4A]">
            Save homes, track offers, and stay ahead of the market.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border border-[#1B4332]/30 bg-[#1B4332]/10 px-4 py-3 text-sm text-[#1B4332]">
            Check your email — we sent you a confirmation link. Click it to activate your account, then sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">
              Full name
            </label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
              required
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
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
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">
              Phone
            </label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#1A1A1A]">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder="Min. 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2D5A47] disabled:opacity-70"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#4A4A4A]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#52B788] hover:text-[#1B4332]"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-[#4A4A4A]">
          <Link href="/how-it-works" className="hover:text-[#52B788]">
            Learn how HomeBase works
          </Link>
        </p>
      </div>
    </div>
  );
}
