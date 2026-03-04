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
      const [listRes, countsRes] = await Promise.all([
        supabase.from('seller_listings').select('id, property_id, status').eq('user_id', user.id).order('created_at', { ascending: false }),
        fetch('/api/sell/offers/counts').then((r) => r.ok ? r.json() : { counts: {} }),
      ]);
      const { data: rows, error: listErr } = listRes;
      if (listErr) {
        setError(listErr.message ?? 'Failed to load listings');
        setLoading(false);
        return;
      }
      if (countsRes?.counts) setOfferCounts(countsRes.counts as OfferCounts);
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
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      ${l.price?.toLocaleString() ?? '—'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(l.status)}`}>
                      {statusLabel(l.status)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/sell/offers/${l.property_id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                    Offers
                    {(offerCounts[l.property_id] ?? 0) > 0 && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        {offerCounts[l.property_id]}
                      </span>
                    )}
                  </Link>
                  <Link href={`/sell/showings/${l.property_id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                    Showings
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
