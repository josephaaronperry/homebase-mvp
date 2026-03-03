'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

const MOCK_LENDERS = [
  { id: 'lender-1', name: 'HomeTrust Mortgage', loanType: '30-Year Fixed', rate: 6.75 },
  { id: 'lender-2', name: 'Prime Lending Co', loanType: '30-Year Fixed', rate: 6.99 },
  { id: 'lender-3', name: 'QuickClose Finance', loanType: '15-Year Fixed', rate: 6.25 },
  { id: 'lender-4', name: 'Nationwide Home Loans', loanType: '30-Year Fixed', rate: 7.12 },
];

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

type PreApproval = { estimated_min: number | null; estimated_max: number | null };
type Pipeline = { id: string; property_id: string };

export default function LendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [preApproval, setPreApproval] = useState<PreApproval | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (propertyId) {
        const [preRes, pipeRes, propRes] = await Promise.all([
          supabase.from('pre_approvals').select('estimated_min, estimated_max').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('buying_pipelines').select('id, property_id').eq('user_id', user.id).eq('property_id', propertyId).maybeSingle(),
          supabase.from('properties').select('address').eq('id', propertyId).maybeSingle(),
        ]);
        setPreApproval((preRes.data ?? null) as PreApproval | null);
        setPipeline((pipeRes.data ?? null) as Pipeline | null);
        setPropertyAddress((propRes.data as { address: string } | null)?.address ?? null);
      }
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const handleSelectLender = useCallback(async (lender: (typeof MOCK_LENDERS)[number]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !pipeline) return;
    setSelecting(lender.id);
    const loanAmount = (preApproval?.estimated_max ?? preApproval?.estimated_min ?? 400000) * 0.8;
    const years = lender.loanType.startsWith('15') ? 15 : 30;
    const estMonthly = Math.round(monthlyPayment(loanAmount, lender.rate, years));
    const { error: selError } = await supabase.from('lender_selections').insert({
      user_id: user.id,
      buying_pipeline_id: pipeline.id,
      lender_name: lender.name,
      lender_loan_type: lender.loanType,
      interest_rate: lender.rate,
      estimated_monthly_payment: estMonthly,
    });
    if (selError) {
      if (selError.code === '23505') {
        router.replace(propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard');
        return;
      }
      alert(selError.message);
      setSelecting(null);
      return;
    }
    const completedRes = await supabase.from('buying_pipelines').select('stage_completed_at').eq('id', pipeline.id).single();
    const completed = (completedRes.data as { stage_completed_at: Record<string, string> } | null)?.stage_completed_at ?? {};
    const nextCompleted = { ...completed, lender_selection: new Date().toISOString() };
    await supabase.from('buying_pipelines').update({
      current_stage: 'lender_selection',
      stage_completed_at: nextCompleted,
      updated_at: new Date().toISOString(),
    }).eq('id', pipeline.id);
    setSelecting(null);
    router.replace(propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard');
  }, [pipeline, preApproval, propertyId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  const loanAmount = (preApproval?.estimated_max ?? preApproval?.estimated_min ?? 400000) * 0.8;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Link href={propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard'} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← {propertyId ? 'Pipeline' : 'Dashboard'}
        </Link>
        <h1 className="text-xl font-semibold text-slate-50">Partner lenders</h1>
        <p className="mt-1 text-sm text-slate-400">
          Compare rates and select a lender. Your estimated loan amount is used for monthly payment estimates.
        </p>
        {propertyAddress && <p className="mt-2 text-xs text-slate-500">Property: {propertyAddress}</p>}

        {propertyId && !pipeline && (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            No buying pipeline for this property. Start from your pipeline or make an offer first.
            <Link href="/dashboard" className="mt-2 block font-semibold text-amber-200 hover:text-amber-100">Back to dashboard</Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {MOCK_LENDERS.map((lender) => {
            const years = lender.loanType.startsWith('15') ? 15 : 30;
            const estMonthly = Math.round(monthlyPayment(loanAmount, lender.rate, years));
            return (
              <div key={lender.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg text-slate-500">
                    {lender.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-50">{lender.name}</h2>
                    <p className="text-sm text-slate-400">{lender.loanType}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-semibold text-emerald-400">{lender.rate}% APR</span>
                      <span className="text-slate-400">Est. payment: <span className="text-slate-200">${estMonthly.toLocaleString()}/mo</span></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectLender(lender)}
                      disabled={!pipeline || selecting !== null}
                      className="mt-4 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {selecting === lender.id ? 'Saving…' : 'Select lender'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
