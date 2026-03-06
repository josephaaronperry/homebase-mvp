'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;

export default function DashboardKycPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    ssn_last4: '',
    id_type: 'drivers_license' as 'drivers_license' | 'passport' | 'state_id',
    id_front_url: '',
    id_back_url: '',
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?redirect=/dashboard/kyc');
        return;
      }
      setLoading(false);
    };
    check();
  }, [router]);

  const handleFileUpload = useCallback(
    async (pathPrefix: string, file: File) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fullPath = `buyer-identity/${user.id}/${pathPrefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('kyc-documents').upload(fullPath, file, { upsert: true });
      if (error) throw new Error(error.message);
      return fullPath;
    },
    []
  );

  const handleIdFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('id-front', file);
      setForm((f) => ({ ...f, id_front_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleIdBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('id-back', file);
      setForm((f) => ({ ...f, id_back_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const addressString = [form.street, form.city, form.state, form.zip].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.dob || !addressString.trim() || !form.phone.trim() || form.ssn_last4.length !== 4 || !form.id_front_url) {
      alert('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/buyer-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          dob: form.dob,
          address: addressString,
          phone: form.phone.trim(),
          ssn_last4: form.ssn_last4,
          id_type: form.id_type,
          id_front_url: form.id_front_url,
          id_back_url: form.id_back_url || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Submission failed');
      }
      router.push('/dashboard');
    } catch (err) {
      alert((err as Error).message ?? 'Submission failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-[#1B4332]/40" />
      </div>
    );
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Personal info' },
    { n: 2, label: 'Government ID' },
    { n: 3, label: 'Review & submit' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">← Dashboard</Link>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">Identity verification</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">Verify your identity so you can make offers on properties.</p>

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${step === n ? 'bg-[#1B4332] text-white' : 'bg-[#E8E6E1] text-[#4A4A4A]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Personal info</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Full legal name *</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Date of birth *</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Current address *</label>
                <input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Street" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="City" />
                  <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="State" />
                  <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="ZIP" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">SSN last 4 *</label>
                <input maxLength={4} value={form.ssn_last4} onChange={(e) => setForm((f) => ({ ...f, ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="1234" />
              </div>
              <div className="flex gap-2 pt-2">
                <Link href="/dashboard" className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-center text-sm font-semibold text-[#4A4A4A]">Cancel</Link>
                <button type="button" onClick={() => setStep(2)} disabled={!form.full_name.trim() || !form.dob || !form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim() || !form.phone.trim() || form.ssn_last4.length !== 4} className="flex-1 rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Government ID</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">ID type *</label>
                <div className="flex gap-2">
                  {(['drivers_license', 'passport', 'state_id'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, id_type: t }))} className={`flex-1 rounded-xl border px-2 py-2 text-xs font-semibold ${form.id_type === t ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}>{t.replace(/_/g, ' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Front of ID *</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleIdFront} className="hidden" />
                  {form.id_front_url ? <span className="text-[#1B4332] font-medium">✓ Front uploaded</span> : 'Upload front image'}
                </label>
              </div>
              {(form.id_type === 'drivers_license' || form.id_type === 'state_id') && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Back of ID (optional)</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-4 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                    <input type="file" accept="image/*,.pdf" onChange={handleIdBack} className="hidden" />
                    {form.id_back_url ? <span className="text-[#1B4332] font-medium">✓ Back uploaded</span> : 'Upload back image'}
                  </label>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!form.id_front_url} className="flex-1 rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Review & submit</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-[#4A4A4A]">Name</dt><dd className="font-medium text-[#1A1A1A]">{form.full_name || '—'}</dd></div>
                <div><dt className="text-[#4A4A4A]">DOB</dt><dd className="font-medium text-[#1A1A1A]">{form.dob || '—'}</dd></div>
                <div><dt className="text-[#4A4A4A]">Address</dt><dd className="font-medium text-[#1A1A1A]">{addressString || '—'}</dd></div>
                <div><dt className="text-[#4A4A4A]">Phone</dt><dd className="font-medium text-[#1A1A1A]">{form.phone || '—'}</dd></div>
                <div><dt className="text-[#4A4A4A]">SSN last 4</dt><dd className="font-medium text-[#1A1A1A]">••{form.ssn_last4 || '—'}</dd></div>
                <div><dt className="text-[#4A4A4A]">ID type</dt><dd className="font-medium text-[#1A1A1A]">{form.id_type.replace(/_/g, ' ')}</dd></div>
                <div><dt className="text-[#4A4A4A]">ID front</dt><dd className="font-medium text-[#1A1A1A]">{form.id_front_url ? 'Uploaded' : '—'}</dd></div>
              </dl>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
