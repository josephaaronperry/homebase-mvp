// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

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
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    id_type: 'drivers_license' as 'drivers_license' | 'passport' | 'state_id',
    id_front_url: '',
    id_back_url: '',
    proof_type: 'pre_approval' as 'pre_approval' | 'proof_of_funds',
    proof_url: '',
    funds_doc_url: '',
    certified: false,
  });
  const [whyIdOpen, setWhyIdOpen] = useState(false);
  const [preApprovalModalOpen, setPreApprovalModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
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
    async (bucket: string, pathPrefix: string, file: File) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      const ext = file.name.split('.').pop() ?? 'pdf';
      const fullPath = `${user.id}/${pathPrefix}-${Date.now()}.${ext}`;
      console.log('[KYC] Uploading to', bucket, fullPath);
      const { error } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true });
      if (error) {
        console.error('[KYC] Upload failed', error);
        throw new Error(error.message);
      }
      return fullPath;
    },
    []
  );

  const handleIdFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'id-front', file);
      setForm((f) => ({ ...f, id_front_url: path }));
    } catch (err) {
      const msg = (err as Error).message ?? 'Upload failed';
      setSubmitError(msg);
      alert(msg);
    }
  };

  const handleIdBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'id-back', file);
      setForm((f) => ({ ...f, id_back_url: path }));
    } catch (err) {
      const msg = (err as Error).message ?? 'Upload failed';
      setSubmitError(msg);
      alert(msg);
    }
  };

  const handleProofDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'proof', file);
      setForm((f) => ({ ...f, proof_url: path, funds_doc_url: path }));
    } catch (err) {
      const msg = (err as Error).message ?? 'Upload failed';
      setSubmitError(msg);
      alert(msg);
    }
  };

  const addressString = [form.street, form.city, form.state, form.zip].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    if (!form.certified) {
      setSubmitError('Please certify that all information is accurate and complete.');
      return;
    }
    setSubmitError(null);
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('Not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[KYC] Submitting for user', user.id);

      const insertPayload = {
        user_id: user.id,
        status: 'PENDING',
        submission_type: 'buyer',
        full_name: form.full_name,
        dob: form.dob || null,
        ssn_last4: form.ssn_last4 || null,
        address: addressString || form.street || null,
        phone: form.phone || null,
        id_type: form.id_type,
        id_front_url: form.id_front_url || null,
        id_back_url: form.id_back_url || null,
        funds_doc_url: form.proof_url || form.funds_doc_url || null,
        proof_url: form.proof_url || null,
        proof_type: form.proof_type || null,
        submitted_at: new Date().toISOString(),
      };
      console.log('[KYC] Insert payload', { ...insertPayload, ssn_last4: '****' });

      const { error: insertError } = await supabase.from('kyc_submissions').insert(insertPayload);
      if (insertError) {
        console.error('[KYC] Insert failed', insertError);
        throw new Error(insertError.message);
      }
      console.log('[KYC] Insert success');

      const { error: updateError } = await supabase.from('users').update({ kycStatus: 'PENDING' }).eq('id', user.id);
      if (updateError) {
        console.warn('[KYC] Could not update kycStatus:', updateError.message);
      } else {
        console.log('[KYC] users.kycStatus set to PENDING');
      }

      setStep(5);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      console.error('[KYC Submit]', msg);
      setSubmitError(msg);
      alert(msg);
    } finally {
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
    { n: 3, label: 'Proof of funds' },
    { n: 4, label: 'Review' },
    { n: 5, label: 'Pending' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]"
        >
          ← Dashboard
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">
          Identity verification
        </h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">
          Complete verification to unlock making offers on properties.
        </p>

        <p className="mt-3 inline-flex items-center gap-2 text-xs text-[#4A4A4A]">
          <svg className="h-4 w-4 shrink-0 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your information is encrypted and secure.
        </p>

        {message && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}
        {submitError && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
                step === n
                  ? 'bg-[#1B4332] text-white'
                  : step > n
                    ? 'bg-[#E8E6E1] text-[#4A4A4A]'
                    : 'bg-[#F4F3F0] text-[#888888]'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Personal information</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Full legal name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Date of birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Current address</label>
                <input
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="Street address"
                  required
                />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                    placeholder="City"
                    required
                  />
                  <input
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                    placeholder="State"
                    required
                  />
                  <input
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                    placeholder="ZIP"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">SSN last 4 digits</label>
                <input
                  maxLength={4}
                  value={form.ssn_last4}
                  onChange={(e) => setForm((f) => ({ ...f, ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="1234"
                  required
                />
              </div>
              <p className="inline-flex items-center gap-2 text-xs text-[#4A4A4A]">
                <svg className="h-4 w-4 shrink-0 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your information is protected with 256-bit encryption.
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.full_name.trim() || !form.dob || !form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim() || !form.phone.trim() || form.ssn_last4.length !== 4}
                className="w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Upload a government-issued photo ID</h2>
              <p className="text-xs text-[#4A4A4A]">Accepted: Driver&apos;s license, Passport, State ID. JPG, PNG, or PDF. Max 10MB.</p>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">
                  ID type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, id_type: 'drivers_license' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      form.id_type === 'drivers_license'
                        ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]'
                        : 'border-[#E8E6E1] text-[#4A4A4A]'
                    }`}
                  >
                    Driver&apos;s license
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, id_type: 'passport' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      form.id_type === 'passport'
                        ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]'
                        : 'border-[#E8E6E1] text-[#4A4A4A]'
                    }`}
                  >
                    Passport
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, id_type: 'state_id' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      form.id_type === 'state_id'
                        ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]'
                        : 'border-[#E8E6E1] text-[#4A4A4A]'
                    }`}
                  >
                    State ID
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">
                  Front of ID
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleIdFront} className="hidden" />
                  {form.id_front_url ? <span className="text-[#1B4332]">✓ Uploaded</span> : <>Drag and drop or click to upload</>}
                </label>
              </div>
              <details className="rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-[#1A1A1A]">Why do we need this?</summary>
                <p className="mt-2 text-xs text-[#4A4A4A]">We verify your identity to protect both buyers and sellers. This ensures only real, verified people can submit offers on homes.</p>
              </details>
              {(form.id_type === 'drivers_license' || form.id_type === 'state_id') && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">
                    Back of ID
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleIdBack}
                      className="hidden"
                    />
                    {form.id_back_url ? (
                      <span className="text-[#1B4332]">✓ Uploaded</span>
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
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.id_front_url}
                  className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Upload proof of funds or mortgage pre-approval</h2>
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">I have</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, proof_type: 'pre_approval' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${form.proof_type === 'pre_approval' ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}
                  >
                    A pre-approval letter
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, proof_type: 'proof_of_funds' }))}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${form.proof_type === 'proof_of_funds' ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}
                  >
                    Proof of funds (bank statement)
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Upload document</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleProofDoc} className="hidden" />
                  {form.proof_url ? <span className="text-[#1B4332]">✓ Uploaded</span> : <>Drag and drop or click to upload</>}
                </label>
              </div>
              <button type="button" onClick={() => setPreApprovalModalOpen(true)} className="text-xs text-[#52B788] hover:text-[#1B4332]">
                Don&apos;t have one yet?
              </button>
              {preApprovalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
                  <div className="max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-lg">
                    <h3 className="font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]">How to get a pre-approval letter</h3>
                    <p className="mt-2 text-sm text-[#4A4A4A]">Contact a lender or use our lender marketplace to compare rates and get a pre-approval letter. Once you have an accepted offer, we’ll help you choose from competing lenders.</p>
                    <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-[#52B788] hover:text-[#1B4332]">Go to lender marketplace →</Link>
                    <button type="button" onClick={() => setPreApprovalModalOpen(false)} className="mt-4 w-full rounded-xl border border-[#E8E6E1] py-2 text-sm font-medium text-[#4A4A4A]">Close</button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!form.proof_url}
                  className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Review and submit</h2>
              <div className="rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] p-4 text-xs text-[#1A1A1A]">
                <p><strong className="text-[#4A4A4A]">Name:</strong> {form.full_name}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">DOB:</strong> {form.dob || '\u2014'}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Address:</strong> {addressString || '\u2014'}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Phone:</strong> {form.phone || '\u2014'}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">ID:</strong> {form.id_type.replace(/_/g, ' ')} ✓</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Proof:</strong> {form.proof_type === 'pre_approval' ? 'Pre-approval letter' : 'Proof of funds'} ✓</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.certified}
                  onChange={(e) => setForm((f) => ({ ...f, certified: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-[#E8E6E1] text-[#1B4332]"
                />
                <span className="text-xs text-[#1A1A1A]">I certify that all information I&apos;ve provided is accurate and complete.</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={submitting || !form.certified} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit for verification'}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B4332]/15 text-3xl text-[#1B4332]">
                  ✓
                </div>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">Your verification is under review</h2>
              <p className="text-sm text-[#4A4A4A]">
                We&apos;ll notify you within 1 business day. You&apos;ll receive an email when your verification is complete.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block w-full rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47]"
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
