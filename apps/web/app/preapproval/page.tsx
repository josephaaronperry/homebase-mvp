'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

const EMPLOYMENT_TYPES = [
  'Full-time employed',
  'Part-time employed',
  'Self-employed',
  'Contractor',
  'Retired',
  'Other',
];

const CREDIT_SCORE_RANGES = [
  'Under 580',
  '580-619',
  '620-659',
  '660-719',
  '720-759',
  '760+',
];

const PURCHASE_TIMELINES = [
  'Within 30 days',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  'Just exploring',
];

function estimateApprovalRange(
  annualIncome: number,
  monthlyDebts: number,
  downPayment: number,
  creditRange: string
): { min: number; max: number } {
  const monthlyIncome = annualIncome / 12;
  const maxPaymentPct = creditRange.startsWith('760') ? 0.45 : creditRange.startsWith('720') ? 0.43 : creditRange.startsWith('660') ? 0.40 : creditRange.startsWith('620') ? 0.38 : 0.36;
  const maxPayment = monthlyIncome * maxPaymentPct - monthlyDebts;
  if (maxPayment <= 0) return { min: downPayment, max: downPayment + 50000 };
  const rate = 0.07;
  const months = 360;
  const monthlyRate = rate / 12;
  const loanCapacity = maxPayment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
  const minMultiplier = creditRange.startsWith('760') ? 0.85 : 0.75;
  const maxMultiplier = creditRange.startsWith('Under') ? 0.9 : 1.0;
  return {
    min: Math.round(downPayment + loanCapacity * minMultiplier),
    max: Math.round(downPayment + loanCapacity * maxMultiplier),
  };
}

export default function PreApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const message = searchParams.get('message') ?? null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(null);
  const [form, setForm] = useState({
    employment_type: '',
    annual_income: 0,
    monthly_debts: 0,
    credit_score_range: '',
    down_payment_amount: 0,
    purchase_timeline: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent('/preapproval' + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`);
        return;
      }
      setLoading(false);
    };
    load();
  }, [router, searchParams]);

  const handleSubmit = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const propertyId = searchParams.get('propertyId');
    const { min, max } = estimateApprovalRange(
      form.annual_income,
      form.monthly_debts,
      form.down_payment_amount,
      form.credit_score_range
    );
    setSubmitting(true);
    const { error } = await supabase.from('pre_approvals').insert({
      user_id: user.id,
      employment_type: form.employment_type,
      annual_income: form.annual_income,
      monthly_debts: form.monthly_debts,
      credit_score_range: form.credit_score_range,
      down_payment_amount: form.down_payment_amount,
      purchase_timeline: form.purchase_timeline,
      estimated_min: min,
      estimated_max: max,
    });
    setSubmitting(false);
    if (error) {
      alert(error.message ?? 'Failed to save pre-approval');
      return;
    }
    if (propertyId) {
      const stageCompletedAt = { pre_approval: new Date().toISOString() };
      await supabase.from('buying_pipelines').upsert(
        {
          user_id: user.id,
          property_id: propertyId,
          current_stage: 'pre_approval',
          stage_completed_at: stageCompletedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,property_id' }
      );
      let address = 'your property';
      const { data: prop } = await supabase.from('properties').select('address').eq('id', propertyId).maybeSingle();
      if (prop?.address) address = prop.address as string;
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            type: 'pipeline_update',
            title: 'Transaction update',
            body: `Your transaction for ${address} has moved to Pre-approval.`,
            link: `/dashboard/buying/${propertyId}`,
          }),
        });
      } catch {}
      router.replace(`/dashboard/buying/${propertyId}`);
      return;
    }
    setEstimate({ min, max });
    setSubmitted(true);
  }, [form, searchParams, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (submitted && estimate) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">✓</div>
            </div>
            <h1 className="text-xl font-semibold text-slate-50">Pre-approval estimate</h1>
            <p className="mt-2 text-sm text-slate-400">
              Based on your information, your estimated approval range is:
            </p>
            <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4">
              <p className="text-2xl font-bold text-emerald-300">
                ${estimate.min.toLocaleString()} – ${estimate.max.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-400">Use this range when shopping for homes.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={redirect}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Continue to {redirect === '/dashboard' ? 'Dashboard' : 'Offer'}
              </Link>
              <Link href="/dashboard" className="text-xs text-slate-400 hover:text-emerald-400">
                Back to dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'Employment' },
    { n: 2, label: 'Income' },
    { n: 3, label: 'Debts' },
    { n: 4, label: 'Credit' },
    { n: 5, label: 'Down payment' },
    { n: 6, label: 'Timeline' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-50">Get pre-approved</h1>
        {message && (
          <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {decodeURIComponent(message)}
          </p>
        )}
        <p className="mt-2 text-sm text-slate-400">
          Answer a few questions to see your estimated approval range.
        </p>

        <div className="mt-6 flex gap-1">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-medium ${
                step === n ? 'bg-emerald-500/20 text-emerald-300' : step > n ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-900/60 text-slate-500'
              }`}
              title={label}
            >
              {n}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Employment type</h2>
              <div className="grid gap-2">
                {EMPLOYMENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, employment_type: t }))}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                      form.employment_type === t ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.employment_type}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Annual income</h2>
              <p className="text-xs text-slate-400">Gross annual income before taxes</p>
              <input
                type="number"
                min={0}
                value={form.annual_income || ''}
                onChange={(e) => setForm((f) => ({ ...f, annual_income: Number(e.target.value) || 0 }))}
                className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-50 outline-none focus:border-emerald-500"
                placeholder="85000"
              />
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!form.annual_income}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Monthly debts</h2>
              <p className="text-xs text-slate-400">Car loans, student loans, credit cards, etc.</p>
              <input
                type="number"
                min={0}
                value={form.monthly_debts || ''}
                onChange={(e) => setForm((f) => ({ ...f, monthly_debts: Number(e.target.value) || 0 }))}
                className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-50 outline-none focus:border-emerald-500"
                placeholder="500"
              />
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Continue
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Credit score range</h2>
              <div className="grid gap-2">
                {CREDIT_SCORE_RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, credit_score_range: r }))}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                      form.credit_score_range === r ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(5)}
                disabled={!form.credit_score_range}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Down payment amount</h2>
              <input
                type="number"
                min={0}
                value={form.down_payment_amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, down_payment_amount: Number(e.target.value) || 0 }))}
                className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-50 outline-none focus:border-emerald-500"
                placeholder="50000"
              />
              <button
                type="button"
                onClick={() => setStep(6)}
                disabled={!form.down_payment_amount}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Purchase timeline</h2>
              <div className="grid gap-2">
                {PURCHASE_TIMELINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, purchase_timeline: t }))}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                      form.purchase_timeline === t ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!form.purchase_timeline || submitting}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'See my estimate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
