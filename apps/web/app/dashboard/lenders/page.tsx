// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type LenderRow = {
  id: string;
  name: string;
  loan_type: string;
  apr: number;
  monthly_payment_per_100k: number | null;
};

function estMonthlyFromPer100k(loanAmount: number, monthlyPer100k: number): number {
  return Math.round((monthlyPer100k / 100_000) * loanAmount);
}

type PreApproval = { estimated_min: number | null; estimated_max: number | null };
type Pipeline = { id: string; property_id: string };
type DealPrice = { agreed_price: number | null };

export default function LendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [preApproval, setPreApproval] = useState<PreApproval | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null);
  const [lenders, setLenders] = useState<LenderRow[]>([]);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      const [lendersRes, preRes, pipeRes, propRes, dealRes] = await Promise.all([
        supabase.from('lenders').select('id, name, loan_type, apr, monthly_payment_per_100k').eq('active', true),
        propertyId ? supabase.from('pre_approvals').select('estimated_min, estimated_max').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
        propertyId ? supabase.from('buying_pipelines').select('id, property_id').eq('user_id', user.id).eq('property_id', propertyId).maybeSingle() : Promise.resolve({ data: null }),
        propertyId ? supabase.from('properties').select('address').eq('id', propertyId).maybeSingle() : Promise.resolve({ data: null }),
        propertyId ? supabase.from('deals').select('agreed_price').eq('property_id', propertyId).eq('buyer_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (lendersRes.error) setError(lendersRes.error.message ?? 'Failed to load lenders');
      else setLenders((lendersRes.data ?? []) as LenderRow[]);
      if (propertyId) {
        if (pipeRes.error || propRes.error) setError(pipeRes.error?.message ?? propRes.error?.message ?? 'Failed to load');
        setPreApproval((preRes.data ?? null) as PreApproval | null);
        setPipeline((pipeRes.data ?? null) as Pipeline | null);
        setPropertyAddress((propRes.data as { address: string } | null)?.address ?? null);
        const deal = (dealRes.data ?? null) as DealPrice | null;
        setAgreedPrice(deal?.agreed_price ?? null);
      }
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const loanAmount = agreedPrice != null ? agreedPrice * 0.8 : (preApproval?.estimated_max ?? preApproval?.estimated_min ?? 400000) * 0.8;

  const handleSelectLender = useCallback(async (lender: LenderRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !pipeline) return;
    setSelecting(lender.id);
    const per100k = lender.monthly_payment_per_100k ?? 650;
    const estMonthly = estMonthlyFromPer100k(loanAmount, per100k);
    const { data: selData, error: selError } = await supabase.from('lender_selections').insert({
      user_id: user.id,
      pipeline_id: pipeline.id,
      lender_name: lender.name,
      loan_type: lender.loan_type,
      rate: lender.apr,
      estimated_monthly_payment: estMonthly,
    }).select('id').single();
    if (selError) {
      if (selError.code === '23505') {
        router.replace(propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard');
        return;
      }
      alert(selError.message);
      setSelecting(null);
      return;
    }
    if (propertyId && selData?.id) {
      await supabase.from('deals').update({ lender_id: (selData as { id: string }).id, updated_at: new Date().toISOString() }).eq('property_id', propertyId).eq('buyer_id', user.id);
    }
    const completedRes = await supabase.from('buying_pipelines').select('stage_completed_at').eq('id', pipeline.id).single();
    const completed = (completedRes.data as { stage_completed_at: Record<string, string> } | null)?.stage_completed_at ?? {};
    const nextCompleted = { ...completed, lender_selected: new Date().toISOString() };
    await supabase.from('buying_pipelines').update({
      current_stage: 'lender_selected',
      stage_completed_at: nextCompleted,
      updated_at: new Date().toISOString(),
    }).eq('id', pipeline.id);
    const address = propertyAddress ?? 'your property';
    try {
      await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'pipeline_update',
          title: 'Transaction update',
          body: `Your transaction for ${address} has moved to Lender Selected.`,
          link: propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard',
        }),
      });
    } catch {}
    try {
      await fetch('/api/lender/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lenderSelectionId: (selData as { id: string }).id }),
      });
    } catch {}
    setSelecting(null);
    router.replace(propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard');
  }, [pipeline, propertyId, propertyAddress, loanAmount, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-8">
          <Link href={propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard'} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">← {propertyId ? 'Pipeline' : 'Dashboard'}</Link>
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
        </main>
      </div>
    );
  }

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
        {propertyId && propertyAddress && (
          <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            You have an accepted offer on <span className="font-semibold">{propertyAddress}</span>. Select a lender to continue your transaction.
          </div>
        )}
        {propertyAddress && !propertyId && <p className="mt-2 text-xs text-slate-500">Property: {propertyAddress}</p>}

        {propertyId && !pipeline && (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            No buying pipeline for this property. Start from your pipeline or make an offer first.
            <Link href="/dashboard" className="mt-2 block font-semibold text-amber-200 hover:text-amber-100">Back to dashboard</Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {lenders.length === 0 && !loading && (
            <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">No lenders available. Contact support.</p>
          )}
          {lenders.map((lender) => {
            const per100k = lender.monthly_payment_per_100k ?? 650;
            const estMonthly = estMonthlyFromPer100k(loanAmount, per100k);
            return (
              <div key={lender.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg text-slate-500">
                    {lender.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-50">{lender.name}</h2>
                    <p className="text-sm text-slate-400">{lender.loan_type}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-semibold text-emerald-400">{lender.apr}% APR</span>
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
