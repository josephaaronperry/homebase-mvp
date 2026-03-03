'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Profile = {
  email: string | null;
  full_name: string | null;
  phone: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({
    email: null,
    full_name: null,
    phone: null,
  });
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setProfile({
        email: user.email ?? null,
        full_name: (user.user_metadata as { full_name?: string })?.full_name ?? '',
        phone: (user.user_metadata as { phone?: string })?.phone ?? '',
      });
      const { data: kyc } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setIsVerified((kyc as { status?: string } | null)?.status === 'APPROVED');
      setLoading(false);
    };

    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name,
        phone: profile.phone,
      },
    });

    if (updateError) {
      setError(updateError.message ?? 'Failed to update profile');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-950 text-slate-50">
        <div className="h-24 w-24 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/80" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60"
          >
            ← Dashboard
          </Link>
          <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Profile
          </h1>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-200">
              {profile.full_name?.[0] ?? 'U'}
            </div>
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-50">
                  {profile.full_name || 'Your name'}
                </span>
                {isVerified ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    ✓ Verified
                  </span>
                ) : (
                  <Link
                    href="/verify"
                    className="rounded-full border border-amber-500/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/10"
                  >
                    Verify identity
                  </Link>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {profile.email ?? 'No email'}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
              Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSave} className="mt-2 space-y-4 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Full name
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-500/60"
                value={profile.full_name ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Phone
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-500/60"
                value={profile.phone ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Email
              </label>
              <input
                className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400"
                value={profile.email ?? ''}
                readOnly
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Profile photo
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="h-10 w-10 rounded-full bg-slate-800" />
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/60"
                >
                  Upload photo
                </button>
                <span className="text-[11px]">
                  Photo uploads are stored via Supabase Storage (configure
                  separately).
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

