'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPT = 'image/*,.pdf';

type Step = 'choose' | 'upload' | 'review';
type Path = 'pre_approval_letter' | 'get_pre_approved' | 'cash_funds' | null;

export default function PreApprovalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [path, setPath] = useState<Path>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [lenderName, setLenderName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [liquidAssets, setLiquidAssets] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login?redirect=/pre-approval');
        return;
      }
      setLoading(false);
    });
  }, [router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError('File must be under 10MB');
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a document');
      return;
    }
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const pathPrefix = path === 'cash_funds' ? 'proof-cash' : 'proof-preapproval';
      const storagePath = `${user.id}/${pathPrefix}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('kyc-documents').upload(storagePath, file);
      if (uploadErr) throw new Error(uploadErr.message);

      const proofType = path === 'cash_funds' ? 'cash_funds' : 'pre_approval_letter';
      const { error: insertErr } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        status: 'PENDING',
        submission_type: 'pre_approval',
        proof_type: proofType,
        proof_url: storagePath,
        full_name: null,
        submitted_at: new Date().toISOString(),
      });
      if (insertErr) throw new Error(insertErr.message);

      const updatePayload: { preApprovalStatus: string; preApprovalAmount?: number; preApprovalExpiry?: string; preApprovalLender?: string } = { preApprovalStatus: 'PENDING' };
      if (path === 'pre_approval_letter' && loanAmount) updatePayload.preApprovalAmount = parseFloat(loanAmount.replace(/[^0-9.]/g, '')) || undefined;
      if (path === 'pre_approval_letter' && expirationDate) updatePayload.preApprovalExpiry = expirationDate;
      if (path === 'pre_approval_letter' && lenderName) updatePayload.preApprovalLender = lenderName;
      if (path === 'cash_funds' && liquidAssets) updatePayload.preApprovalAmount = parseFloat(liquidAssets.replace(/[^0-9.]/g, '')) || undefined;

      await supabase.from('users').update(updatePayload).eq('id', user.id);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/dashboard" className="mb-6 inline-flex text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">← Dashboard</Link>

        {step === 'choose' && (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1A1A1A]">Get pre-approved</h1>
            <p className="mt-2 text-[#4A4A4A]">Choose how you want to show your buying power.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-1">
              <button
                type="button"
                onClick={() => { setPath('pre_approval_letter'); setStep('upload'); }}
                className="flex flex-col items-start rounded-2xl border border-[#E8E6E1] bg-white p-6 text-left shadow-sm transition hover:border-[#1B4332] hover:shadow-md"
              >
                <span className="text-3xl">📄</span>
                <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]">I have a pre-approval letter</h2>
                <p className="mt-1 text-sm text-[#4A4A4A]">Upload your existing pre-approval letter from any lender. We&apos;ll review it and mark you as pre-approved.</p>
              </button>
              <Link
                href="/dashboard/lenders"
                className="flex flex-col items-start rounded-2xl border border-[#E8E6E1] bg-white p-6 text-left shadow-sm transition hover:border-[#1B4332] hover:shadow-md"
              >
                <span className="text-3xl">🏦</span>
                <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]">I need to get pre-approved</h2>
                <p className="mt-1 text-sm text-[#4A4A4A]">Browse our lender marketplace. Get competing offers and choose the best rate.</p>
                <span className="mt-3 text-sm font-semibold text-[#52B788]">Go to lenders →</span>
              </Link>
              <button
                type="button"
                onClick={() => { setPath('cash_funds'); setStep('upload'); }}
                className="flex flex-col items-start rounded-2xl border border-[#E8E6E1] bg-white p-6 text-left shadow-sm transition hover:border-[#1B4332] hover:shadow-md"
              >
                <span className="text-3xl">💵</span>
                <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]">I&apos;m a cash buyer</h2>
                <p className="mt-1 text-sm text-[#4A4A4A]">Upload proof of funds (bank statement or investment account statement showing sufficient funds).</p>
              </button>
            </div>
          </>
        )}

        {step === 'upload' && path && (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1A1A1A]">
              {path === 'cash_funds' ? 'Upload proof of funds' : 'Upload pre-approval'}
            </h1>
            <p className="mt-2 text-sm text-[#4A4A4A]">PDF, JPG, or PNG. Max 10MB.</p>

            {path === 'pre_approval_letter' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#4A4A4A]">Lender name</label>
                  <input value={lenderName} onChange={(e) => setLenderName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="e.g. Chase Home Lending" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#4A4A4A]">Loan amount</label>
                  <input value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="e.g. 500000" />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-[#4A4A4A]">Expiration date</label>
                  <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" />
                </div>
              </div>
            )}

            {path === 'cash_funds' && (
              <div className="mt-6">
                <label className="block text-xs font-medium uppercase tracking-wider text-[#4A4A4A]">Total liquid assets (approx.)</label>
                <input value={liquidAssets} onChange={(e) => setLiquidAssets(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="e.g. 750000" />
              </div>
            )}

            <div className="mt-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-8 text-center text-sm text-[#4A4A4A] hover:border-[#1B4332]">
                <input type="file" accept={ACCEPT} onChange={handleFile} className="hidden" />
                {file ? <span className="text-[#1B4332] font-medium">✓ {file.name}</span> : 'Drag and drop or click to upload'}
              </label>
            </div>

            <p className="mt-4 inline-flex items-center gap-2 text-xs text-[#4A4A4A]">
              <svg className="h-4 w-4 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Your document is encrypted and only used to verify your buying power.
            </p>

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => { setStep('choose'); setPath(null); setFile(null); setError(null); }} className="rounded-xl border border-[#E8E6E1] px-4 py-2.5 text-sm font-semibold text-[#4A4A4A]">Back</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !file} className="rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>
            </div>
          </>
        )}

        {step === 'review' && (
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1B4332]/15 text-3xl text-[#1B4332]">✓</div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[#1A1A1A]">Your pre-approval is under review</h1>
            <p className="mt-2 text-sm text-[#4A4A4A]">We&apos;ll notify you within 1 business day.</p>
            <div className="mt-6 flex flex-col gap-2 text-left text-sm">
              <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700">Submitted</span></div>
              <div className="flex items-center gap-2"><span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700">Under Review</span></div>
              <div className="flex items-center gap-2 text-[#888]">Approved</div>
            </div>
            <Link href="/dashboard" className="mt-8 inline-block rounded-xl bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47]">Back to dashboard</Link>
          </div>
        )}
      </main>
    </div>
  );
}
