'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Listing = {
  id: string;
  property_id: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
};

type OfferCounts = Record<string, number>;
type ShowingCounts = Record<string, number>;
type DealPropertyIds = Set<string>;
type DealInfo = { dealId: string; currentStage: string };
type DealByProperty = Record<string, DealInfo>;

const SELLER_PIPELINE_STAGES = [
  { id: 'offer_accepted', label: 'Offer Accepted' },
  { id: 'lender_selected', label: 'Lender Selected' },
  { id: 'inspection', label: 'Inspection & Appraisal' },
  { id: 'loan_processing', label: 'Loan Processing' },
  { id: 'closing', label: 'Closing' },
];

function sellerStageIndex(currentStage: string): number {
  if (['pre_approval', 'offer_submitted', 'offer_accepted'].includes(currentStage)) return 0;
  if (['lender_selection', 'lender_selected'].includes(currentStage)) return 1;
  if (['inspection_booked', 'appraisal'].includes(currentStage)) return 2;
  if (currentStage === 'loan_processing') return 3;
  if (['clear_to_close', 'closing'].includes(currentStage)) return 4;
  return 0;
}

function statusLabel(s: string): string {
  if (s === 'pending_review') return 'Pending Review';
  if (s === 'active') return 'Active';
  if (s === 'sold') return 'Sold';
  if (s === 'withdrawn') return 'Withdrawn';
  return s;
}

function statusClass(s: string): string {
  if (s === 'pending_review') return 'bg-amber-500/15 text-amber-300';
  if (s === 'active') return 'bg-emerald-500/15 text-emerald-300';
  if (s === 'sold') return 'bg-slate-600 text-slate-200';
  if (s === 'withdrawn') return 'bg-slate-600 text-slate-400';
  return 'bg-slate-700/60 text-slate-300';
}

export default function SellDashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [offerCounts, setOfferCounts] = useState<OfferCounts>({});
  const [showingCounts, setShowingCounts] = useState<ShowingCounts>({});
  const [dealPropertyIds, setDealPropertyIds] = useState<DealPropertyIds>(new Set());
  const [dealByProperty, setDealByProperty] = useState<DealByProperty>({});
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
      const [listRes, countsRes, showingsCountsRes, dealsRes] = await Promise.all([
        supabase.from('seller_listings').select('id, property_id, status').eq('user_id', user.id).order('created_at', { ascending: false }),
        fetch('/api/sell/offers/counts').then((r) => r.ok ? r.json() : { counts: {} }),
        fetch('/api/sell/showings/counts').then((r) => r.ok ? r.json() : { counts: {} }),
        supabase.from('deals').select('id, property_id, buyer_id').eq('seller_id', user.id).eq('status', 'active'),
      ]);
      const { data: rows, error: listErr } = listRes;
      if (listErr) {
        setError(listErr.message ?? 'Failed to load listings');
        setLoading(false);
        return;
      }
      if (countsRes?.counts) setOfferCounts(countsRes.counts as OfferCounts);
      if (showingsCountsRes?.counts) setShowingCounts(showingsCountsRes.counts as ShowingCounts);
      const dealList = (dealsRes.data ?? []) as { id: string; property_id: string; buyer_id: string }[];
      const dealIds = new Set(dealList.map((d) => d.property_id));
      setDealPropertyIds(dealIds);
      if (dealList.length > 0) {
        const pipelinePairs = dealList.map((d) => ({ user_id: d.buyer_id, property_id: d.property_id }));
        const { data: pipes } = await supabase.from('buying_pipelines').select('user_id, property_id, current_stage');
        const pipeMap = new Map<string, string>();
        (pipes ?? []).forEach((p: { user_id: string; property_id: string; current_stage: string }) => {
          pipeMap.set(`${p.user_id}:${p.property_id}`, p.current_stage);
        });
        const byProp: DealByProperty = {};
        dealList.forEach((d) => {
          byProp[d.property_id] = { dealId: d.id, currentStage: pipeMap.get(`${d.buyer_id}:${d.property_id}`) ?? 'offer_accepted' };
        });
        setDealByProperty(byProp);
      } else {
        setDealByProperty({});
      }
      if (rows && rows.length > 0) {
        const ids = rows.map((r: { property_id: string }) => r.property_id);
        const { data: props, error: propErr } = await supabase.from('properties').select('id, address, city, state, price').in('id', ids);
        if (propErr) setError(propErr.message ?? 'Failed to load property details');
        else {
          const propMap = new Map((props ?? []).map((p: { id: string; address: string | null; city: string | null; state: string | null; price: number | null }) => [p.id, p]));
          setListings(
            (rows as { id: string; property_id: string; status: string }[]).map((r) => {
              const p = propMap.get(r.property_id) as { address: string | null; city: string | null; state: string | null; price: number | null } | undefined;
              return { id: r.id, property_id: r.property_id, status: r.status, address: p?.address ?? null, city: p?.city ?? null, state: p?.state ?? null, price: p?.price ?? null };
            })
          );
        }
      }
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/sell" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Sell
        </Link>
        <h1 className="text-2xl font-semibold text-slate-50">Seller dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Your listings and activity</p>

        <Link href="/sell/list" className="mt-6 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
          + New listing
        </Link>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-sm text-slate-400">No listings yet. Create your first listing to get started.</p>
            <Link href="/sell/list" className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">+ New listing</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {l.address ?? 'Property'}, {l.city}, {l.state}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">
                      ${l.price?.toLocaleString() ?? '—'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(l.status)}`}>
                      {statusLabel(l.status)}
                    </span>
                    {dealPropertyIds.has(l.property_id) && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                        Under contract
                      </span>
                    )}
                  </div>
                  {dealPropertyIds.has(l.property_id) && dealByProperty[l.property_id] && (
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Under contract</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {SELLER_PIPELINE_STAGES.map((stage, idx) => {
                          const activeIdx = sellerStageIndex(dealByProperty[l.property_id].currentStage);
                          const isActive = idx === activeIdx;
                          const isComplete = idx < activeIdx;
                          return (
                            <span
                              key={stage.id}
                              className={`rounded-lg px-2 py-1 text-[11px] font-medium ${isActive ? 'bg-emerald-500/20 text-emerald-300' : isComplete ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-800/80 text-slate-500'}`}
                            >
                              {stage.label}
                            </span>
                          );
                        })}
                      </div>
                      <Link href={`/sell/pipeline/${dealByProperty[l.property_id].dealId}`} className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                        View full deal details →
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/sell/offers/${l.property_id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                    {(offerCounts[l.property_id] ?? 0)} offers
                  </Link>
                  <Link href={`/sell/showings/${l.property_id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                    {(showingCounts[l.property_id] ?? 0)} showings
                  </Link>
                  <Link href={`/properties/${l.property_id}`} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                    View listing
                  </Link>
                  <Link href={`/sell/list/${l.property_id}`} className="text-xs font-medium text-slate-400 hover:text-slate-300">
                    Edit listing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
