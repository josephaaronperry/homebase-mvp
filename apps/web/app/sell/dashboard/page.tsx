'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Listing = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  status: string | null;
};

export default function SellDashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [showingCounts, setShowingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data: props } = await supabase
        .from('properties')
        .select('id, address, city, state, price, status')
        .eq('status', 'PENDING_REVIEW');
      setListings((props ?? []) as Listing[]);

      const { data: offers } = await supabase.from('offers').select('property_id');
      const counts: Record<string, number> = {};
      (offers ?? []).forEach((o: { property_id: string }) => {
        counts[o.property_id] = (counts[o.property_id] ?? 0) + 1;
      });
      setOfferCounts(counts);

      const { data: showings } = await supabase.from('showings').select('property_id');
      const showCounts: Record<string, number> = {};
      (showings ?? []).forEach((s: { property_id: string }) => {
        showCounts[s.property_id] = (showCounts[s.property_id] ?? 0) + 1;
      });
      setShowingCounts(showCounts);
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

        <Link
          href="/sell/list"
          className="mt-6 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          + New listing
        </Link>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            No listings yet. Create your first listing to get started.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {listings.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {l.address}, {l.city}, {l.state}
                  </div>
                  <div className="text-xs text-slate-500">
                    ${l.price?.toLocaleString() ?? '—'} • {l.status}
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="rounded-full bg-sky-500/15 px-2 py-1 text-sky-300">
                    {offerCounts[l.id] ?? 0} offers
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">
                    {showingCounts[l.id] ?? 0} showings
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
