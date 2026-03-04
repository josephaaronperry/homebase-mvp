'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PIPELINE_STAGES, getStageStatus, getStageLabel } from '@/lib/pipeline-stages';

const supabase = getSupabaseClient();

type Deal = {
  id: string;
  property_id: string;
  agreed_price: number | null;
  status: string;
};

type Property = { address: string | null; city: string | null; state: string | null };
type Pipeline = { current_stage: string; stage_completed_at: Record<string, string> | null };

function sellerStageDescription(stageId: string, completedAt: Record<string, string>): string {
  switch (stageId) {
    case 'pre_approval':
      return 'Buyer is getting pre-approved for financing.';
    case 'offer_submitted':
      return 'Offer has been submitted.';
    case 'offer_accepted':
      return 'You accepted the offer. Deal is under contract.';
    case 'lender_selection':
      return 'Buyer is selecting a lender.';
    case 'lender_selected':
      return completedAt['lender_selected'] ? `Lender selected on ${new Date(completedAt['lender_selected']).toLocaleDateString()}.` : 'Buyer has chosen a lender.';
    case 'inspection_booked':
      return completedAt['inspection_booked'] ? `Inspection scheduled for ${new Date(completedAt['inspection_booked']).toLocaleDateString()}.` : 'Buyer is scheduling the inspection.';
    case 'appraisal':
      return 'Appraisal ordered or completed.';
    case 'loan_processing':
      return 'Buyer\'s lender is processing the loan.';
    case 'clear_to_close':
      return 'Lender has cleared the buyer to close.';
    case 'closing':
      return 'Closing scheduled — keys will transfer at closing.';
    default:
      return getStageLabel(stageId);
  }
}

export default function SellPipelineDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.dealId as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      const { data: dealRow, error: dealErr } = await supabase
        .from('deals')
        .select('id, property_id, agreed_price, status')
        .eq('id', dealId)
        .eq('seller_id', user.id)
        .single();
      if (dealErr || !dealRow) {
        setError('Deal not found');
        setLoading(false);
        return;
      }
      setDeal(dealRow as Deal);
      const propId = (dealRow as Deal).property_id;
      const [propRes, pipeRes] = await Promise.all([
        supabase.from('properties').select('address, city, state').eq('id', propId).maybeSingle(),
        supabase.from('buying_pipelines').select('current_stage, stage_completed_at').eq('property_id', propId).maybeSingle(),
      ]);
      if (propRes.data) setProperty(propRes.data as Property);
      if (pipeRes.data) setPipeline(pipeRes.data as Pipeline);
      setLoading(false);
    };
    load();
  }, [dealId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-12">
          <p className="text-slate-400">{error ?? 'Deal not found.'}</p>
          <Link href="/sell/dashboard" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">← Back to seller dashboard</Link>
        </main>
      </div>
    );
  }

  const addressLine = [property?.address, property?.city, property?.state].filter(Boolean).join(', ') || 'Property';
  const completedAt = (pipeline?.stage_completed_at ?? {}) as Record<string, string>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/sell/dashboard" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Seller dashboard
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h1 className="text-lg font-semibold text-slate-50">{addressLine}</h1>
          <p className="mt-1 text-sm text-emerald-400">
            Agreed price: {deal.agreed_price != null ? `$${deal.agreed_price.toLocaleString()}` : '—'}
          </p>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">Buyer pipeline</h2>
        <p className="mt-1 text-xs text-slate-500">Progress from the seller&apos;s perspective. Admin can advance stages manually.</p>
        <div className="mt-4 space-y-2">
          {PIPELINE_STAGES.map((stage) => {
            const status = getStageStatus(stage.id, pipeline?.current_stage ?? '', completedAt);
            return (
              <div
                key={stage.id}
                className={`rounded-xl border px-4 py-3 ${
                  status === 'active' ? 'border-emerald-500/50 bg-emerald-500/10' : status === 'complete' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${status === 'active' ? 'text-emerald-300' : status === 'complete' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {getStageLabel(stage.id)}
                  </span>
                  {status === 'complete' && <span className="text-xs text-slate-500">✓</span>}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {sellerStageDescription(stage.id, completedAt)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-500">Seller actions (e.g. provide documents) will appear here when required. For MVP, admin advances pipeline stages.</p>
        <Link href="/sell/dashboard" className="mt-6 inline-block rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-500/50">
          ← Back to seller dashboard
        </Link>
      </main>
    </div>
  );
}
