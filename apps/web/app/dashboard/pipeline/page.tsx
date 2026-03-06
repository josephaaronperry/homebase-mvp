// SPEC-5: Transaction pipeline — schema per SCHEMA.md
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

const PIPELINE_STAGES = [
  { id: 1, label: 'Offer Accepted', description: 'Congratulations! Your offer was accepted.', timeline: '—', cta: null },
  { id: 2, label: 'Lender Selected', description: 'Choose your mortgage lender to move forward.', timeline: '~1–2 days', cta: { label: 'Select your lender →', href: '/lenders' } },
  { id: 3, label: 'Inspection Scheduled', description: 'Schedule your home inspection.', timeline: '~3–5 days', cta: { label: 'Book your inspection →', href: '/dashboard/inspections' } },
  { id: 4, label: 'Inspection Complete', description: 'Inspection is done. Review the report.', timeline: '~1–2 days', cta: null },
  { id: 5, label: 'Appraisal', description: 'Property appraisal ordered and in progress.', timeline: '~1–2 weeks', cta: null },
  { id: 6, label: 'Loan Processing', description: 'Your lender is processing your loan.', timeline: '~2–4 weeks', cta: null },
  { id: 7, label: 'Clear to Close', description: 'Your loan has been approved. Closing is almost here.', timeline: '~1 week', cta: null },
  { id: 8, label: 'Closing Scheduled', description: 'Closing date is set. Sign documents and get the keys.', timeline: '—', cta: null },
  { id: 9, label: 'Closed', description: "🎉 Congratulations — you're a homeowner!", timeline: '—', cta: null },
] as const;

function statusToStageIndex(status: string | null): number {
  if (!status) return 1;
  const s = status.toLowerCase();
  if (s === 'pending_lender' || s === 'active') return 1;
  if (s === 'lender_selected') return 2;
  if (s === 'inspection_scheduled') return 3;
  if (s === 'inspection_complete') return 4;
  if (s === 'appraisal') return 5;
  if (s === 'loan_processing') return 6;
  if (s === 'clear_to_close') return 7;
  if (s === 'closing_scheduled') return 8;
  if (s === 'closed') return 9;
  return 1;
}

type DealData = {
  id: string;
  property_id: string;
  agreed_price: number | null;
  status: string;
  lender_id: string | null;
  created_at: string | null;
  property_address: string | null;
  lender_name: string | null;
};

export default function PipelinePage() {
  const router = useRouter();
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      const { data: deals, error: dealsErr } = await supabase
        .from('deals')
        .select('id, property_id, agreed_price, status, lender_id, created_at')
        .eq('buyer_id', user.id)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
        .limit(1);
      if (dealsErr) {
        setError(dealsErr.message);
        setLoading(false);
        return;
      }
      const row = deals?.[0] as { id: string; property_id: string; agreed_price: number | null; status: string; lender_id: string | null; created_at: string | null } | undefined;
      if (!row) {
        setDeal(null);
        setLoading(false);
        return;
      }
      const [propRes, lenderRes] = await Promise.all([
        supabase.from('properties').select('address').eq('id', row.property_id).maybeSingle(),
        row.lender_id
          ? supabase.from('lender_selections').select('lender_name').eq('id', row.lender_id).maybeSingle()
          : { data: null },
      ]);
      const prop = propRes.data as { address: string | null } | null;
      const lender = lenderRes.data as { lender_name: string | null } | null;
      setDeal({
        id: row.id,
        property_id: row.property_id,
        agreed_price: row.agreed_price,
        status: row.status,
        lender_id: row.lender_id,
        created_at: row.created_at,
        property_address: prop?.address ?? null,
        lender_name: lender?.lender_name ?? null,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  const currentStage = deal ? statusToStageIndex(deal.status) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-xs font-medium text-[#4A4A4A] hover:text-[#1B4332]">← Dashboard</Link>
            <h1 className="mt-2 font-display text-2xl font-semibold text-[#1A1A1A]">Transaction pipeline</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
          </div>
        ) : !deal ? (
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-4">📋</p>
            <h2 className="font-display text-lg font-semibold text-[#1A1A1A]">No active transaction</h2>
            <p className="mt-2 text-sm text-[#4A4A4A]">Browse homes to get started. When your offer is accepted, you can track progress here.</p>
            <Link
              href="/properties"
              className="mt-6 inline-block rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
            >
              Browse homes →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="min-w-0 flex-1 space-y-3">
              {PIPELINE_STAGES.map((stage) => {
                const isComplete = stage.id < currentStage || (stage.id === 9 && currentStage >= 9);
                const isActive = stage.id === currentStage;
                const isFuture = stage.id > currentStage;
                return (
                  <div
                    key={stage.id}
                    className={`rounded-2xl border px-4 py-4 shadow-sm ${
                      isActive
                        ? 'border-[#1B4332]/40 bg-[#D1FAE5]'
                        : 'border-[#E8E6E1] bg-white'
                    } ${isFuture ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        {isComplete ? (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332] text-white">✓</span>
                        ) : isActive ? (
                          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4332] text-white">
                            <span className="absolute inset-0 animate-ping rounded-full bg-[#1B4332] opacity-40" />
                            <span className="relative block h-2 w-2 rounded-full bg-white" />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 rounded-full border-2 border-[#888888] bg-transparent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold ${isComplete ? 'text-[#1B4332]' : isFuture ? 'text-[#888888]' : 'text-[#1A1A1A]'}`}>
                          {stage.label}
                        </p>
                        <p className={`mt-0.5 text-sm ${isFuture ? 'text-[#888888]' : 'text-[#4A4A4A]'}`}>
                          {stage.description}
                        </p>
                        {stage.timeline && stage.timeline !== '—' && (
                          <p className="mt-1 text-xs text-[#4A4A4A]">Est. {stage.timeline}</p>
                        )}
                        {stage.cta && (isActive || isComplete) && (
                          <div className="mt-3">
                            <Link
                              href={stage.id === 2 ? `/lenders?dealId=${deal.id}` : stage.cta.href}
                              className="inline-block rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
                            >
                              {stage.cta.label}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="w-full shrink-0 lg:w-72">
              <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4A4A4A]">Deal details</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-[#4A4A4A]">Property</dt>
                    <dd className="font-medium text-[#1A1A1A]">{deal.property_address ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#4A4A4A]">Agreed price</dt>
                    <dd className="font-medium text-[#1A1A1A]">
                      {deal.agreed_price != null ? `$${Number(deal.agreed_price).toLocaleString()}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#4A4A4A]">Lender</dt>
                    <dd className="font-medium text-[#1A1A1A]">{deal.lender_name ?? 'Not yet selected'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#4A4A4A]">Estimated close</dt>
                    <dd className="font-medium text-[#1A1A1A]">—</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
