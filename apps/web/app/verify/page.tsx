'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Step = 1 | 2 | 3 | 4 | 5;

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    ssn_last4: '',
    address: '',
    id_type: 'drivers_license' as 'drivers_license' | 'passport',
    id_front_url: '',
    id_back_url: '',
    funds_doc_url: '',
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?redirect=/verify');
        return;
      }
      setLoading(false);
    };
    check();
  }, [router]);

  const handleFileUpload = useCallback(
    async (bucket: string, path: string, file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      const ext = file.name.split('.').pop() ?? 'pdf';
      const fullPath = `${user.id}/${path}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, { upsert: true });
      if (error) {
        throw new Error(error.message);
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      return urlData.publicUrl;
    },
    []
  );

  const handleIdFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-docs', 'id-front', file);
      setForm((f) => ({ ...f, id_front_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleIdBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-docs', 'id-back', file);
      setForm((f) => ({ ...f, id_back_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleFundsDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-docs', 'funds', file);
      setForm((f) => ({ ...f, funds_doc_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase.from('kyc_submissions').insert({
      user_id: user.id,
      status: 'PENDING',
      full_name: form.full_name,
      dob: form.dob || null,
      ssn_last4: form.ssn_last4 || null,
      address: form.address,
      id_type: form.id_type,
      id_front_url: form.id_front_url || null,
      id_back_url: form.id_back_url || null,
      funds_doc_url: form.funds_doc_url || null,
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      alert(error.message ?? 'Failed to submit');
      return;
    }
    setStep(5);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Personal info' },
    { n: 2, label: 'Government ID' },
    { n: 3, label: 'Proof of funds' },
    { n: 4, label: 'Review' },
    { n: 5, label: 'Pending' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400"
        >
          ← Dashboard
        </Link>

        <h1 className="text-xl font-semibold text-slate-50">
          Identity verification
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete verification to unlock making offers on properties.
        </p>

        {message && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
                step === n
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : step > n
                    ? 'bg-slate-800/60 text-slate-400'
                    : 'bg-slate-900/60 text-slate-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Personal information</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Full legal name
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  SSN last 4 digits
                </label>
                <input
                  maxLength={4}
                  value={form.ssn_last4}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Current address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.full_name.trim() || !form.address.trim()}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Government ID</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  ID type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, id_type: 'drivers_license' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      form.id_type === 'drivers_license'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    Driver&apos;s license
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, id_type: 'passport' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      form.id_type === 'passport'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    Passport
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Front of ID
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleIdFront}
                    className="hidden"
                  />
                  {form.id_front_url ? (
                    <span className="text-emerald-400">✓ Uploaded</span>
                  ) : (
                    <>Click to upload</>
                  )}
                </label>
              </div>
              {form.id_type === 'drivers_license' && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Back of ID
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleIdBack}
                      className="hidden"
                    />
                    {form.id_back_url ? (
                      <span className="text-emerald-400">✓ Uploaded</span>
                    ) : (
                      <>Click to upload</>
                    )}
                  </label>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.id_front_url}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Proof of funds</h2>
              <p className="text-xs text-slate-400">
                Upload a bank statement (last 30 days) or pre-approval letter.
              </p>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Bank statement or pre-approval letter
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFundsDoc}
                    className="hidden"
                  />
                  {form.funds_doc_url ? (
                    <span className="text-emerald-400">✓ Uploaded</span>
                  ) : (
                    <>Click to upload</>
                  )}
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!form.funds_doc_url}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Review and submit</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-200">
                <p><strong className="text-slate-400">Name:</strong> {form.full_name}</p>
                <p className="mt-1"><strong className="text-slate-400">DOB:</strong> {form.dob || '—'}</p>
                <p className="mt-1"><strong className="text-slate-400">SSN last 4:</strong> ••••</p>
                <p className="mt-1"><strong className="text-slate-400">Address:</strong> {form.address}</p>
                <p className="mt-1"><strong className="text-slate-400">ID:</strong> {form.id_type.replace('_', ' ')} ✓</p>
                <p className="mt-1"><strong className="text-slate-400">Proof of funds:</strong> ✓</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
                  ✓
                </div>
              </div>
              <h2 className="text-lg font-semibold text-slate-50">Verification submitted</h2>
              <p className="text-sm text-slate-400">
                Your identity verification has been submitted. We typically review within 24 hours.
                You&apos;ll receive an email when your verification is complete.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Return to dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
