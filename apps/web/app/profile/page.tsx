// Schema verified against SCHEMA.md - 2025-03-01
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
  const [password, setPassword] = useState({ new: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data: row } = await supabase.from('users').select('fullName, phone, email').eq('id', user.id).maybeSingle();
      if (row) {
        setProfile({
          email: (row as { email: string | null }).email ?? user.email ?? null,
          full_name: (row as { fullName: string | null }).fullName ?? (user.user_metadata as { full_name?: string })?.full_name ?? '',
          phone: (row as { phone: string | null }).phone ?? (user.user_metadata as { phone?: string })?.phone ?? '',
        });
      } else {
        setProfile({
          email: user.email ?? null,
          full_name: (user.user_metadata as { full_name?: string })?.full_name ?? '',
          phone: (user.user_metadata as { phone?: string })?.phone ?? '',
        });
        await supabase.from('users').upsert({
          id: user.id,
          fullName: (user.user_metadata as { full_name?: string })?.full_name ?? null,
          phone: (user.user_metadata as { phone?: string })?.phone ?? null,
          email: user.email ?? null,
          updatedAt: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
      const { data: kyc } = await supabase.from('kyc_submissions').select('status').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updateError } = await supabase.from('users').upsert({
      id: user.id,
      fullName: profile.full_name || null,
      phone: profile.phone || null,
      email: user.email ?? null,
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (updateError) {
      setError(updateError.message ?? 'Failed to update profile');
      setSaving(false);
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: profile.full_name, phone: profile.phone } });
    setSaving(false);
    setSuccess(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (password.new.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password.new !== password.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    const { error: pwError } = await supabase.auth.updateUser({ password: password.new });
    setPasswordSaving(false);
    if (pwError) {
      setPasswordError(pwError.message ?? 'Failed to update password.');
      return;
    }
    setPasswordSuccess(true);
    setPassword({ new: '', confirm: '' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[#FAFAF8]">
        <div className="h-24 w-24 animate-pulse rounded-3xl border-2 border-[#E8E6E1] bg-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="rounded-full border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-medium text-[#4A4A4A] hover:border-[#1B4332] hover:text-[#1B4332]">
            ← Dashboard
          </Link>
          <h1 className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]">Profile</h1>
        </header>

        <section className="space-y-4 rounded-2xl border border-[#E8E6E1] bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F0] text-xl font-semibold text-[#1B4332]">
              {profile.full_name?.[0] ?? 'U'}
            </div>
            <div className="flex-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1A1A1A]">{profile.full_name || 'Your name'}</span>
                {isVerified ? (
                  <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#065F46]">✓ Verified</span>
                ) : (
                  <Link href="/verify" className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E] hover:bg-[#FDE68A]">
                    Verify identity
                  </Link>
                )}
              </div>
              <div className="text-xs text-[#888888]">{profile.email ?? 'No email'}</div>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div>}
          {success && <div className="rounded-2xl border border-[#D1FAE5] bg-[#D1FAE5]/50 px-4 py-3 text-xs text-[#065F46]">Profile updated successfully.</div>}

          <form onSubmit={handleSave} className="mt-2 space-y-4 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#888888]">Display name</label>
              <input className="w-full rounded-xl border border-[#E8E6E1] bg-white px-4 py-3 text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:outline-none" value={profile.full_name ?? ''} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#888888]">Phone</label>
              <input className="w-full rounded-xl border border-[#E8E6E1] bg-white px-4 py-3 text-[#1A1A1A] outline-none focus:border-[#1B4332] focus:outline-none" value={profile.phone ?? ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#888888]">Email</label>
              <input className="w-full cursor-not-allowed rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3 text-[#888888]" value={profile.email ?? ''} readOnly />
            </div>
            <button type="submit" disabled={saving} className="mt-2 w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F] disabled:opacity-70">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>

          <div className="border-t border-[#E8E6E1] pt-6 mt-6">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Change password</h2>
            {passwordError && <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{passwordError}</div>}
            {passwordSuccess && <div className="mt-2 rounded-xl border border-[#D1FAE5] bg-[#D1FAE5]/50 px-3 py-2 text-xs text-[#065F46]">Password updated.</div>}
            <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
              <input type="password" value={password.new} onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))} placeholder="New password" className="w-full rounded-xl border border-[#E8E6E1] bg-white px-4 py-3 text-[#1A1A1A] placeholder:text-[#888888] focus:border-[#1B4332] focus:outline-none" minLength={8} />
              <input type="password" value={password.confirm} onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))} placeholder="Confirm new password" className="w-full rounded-xl border border-[#E8E6E1] bg-white px-4 py-3 text-[#1A1A1A] placeholder:text-[#888888] focus:border-[#1B4332] focus:outline-none" />
              <button type="submit" disabled={passwordSaving || !password.new || !password.confirm} className="rounded-xl bg-[#1B4332] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2D6A4F] disabled:opacity-50">
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
