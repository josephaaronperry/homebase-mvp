'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';

type Offer = {
  id: string | number;
  price: number | null;
  status: string | null;
  list_price?: number | null;
  property_address?: string | null;
  property_city?: string | null;
  property_state?: string | null;
};

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('offers')
        .select(
          'id, price, list_price, status, property_address, property_city, property_state',
        )
        .order('created_at', { ascending: false });

      setOffers((data ?? []) as Offer[]);
      setLoading(false);
    };

    load();
  }, [router]);

  const fmt = (p: number | null) =>
    p ? `$${Number(p).toLocaleString()}` : '—';

  const statusColor = (s: string | null) => {
    if (s === 'ACCEPTED') return 'bg-emerald-500/15 text-emerald-300';
    if (s === 'SUBMITTED') return 'bg-sky-500/15 text-sky-300';
    if (s === 'REJECTED') return 'bg-rose-500/15 text-rose-300';
    return 'bg-slate-700/60 text-slate-200';
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-950 text-slate-50">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60"
        >
          ← Dashboard
        </Link>
        <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Offers
        </h1>
      </header>

      <main className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              My offers
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Track each offer&apos;s status and quickly jump back into listings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
              />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="mb-3 text-4xl">📝</div>
            <p>No offers yet. Start by exploring properties.</p>
            <div className="mt-6">
              <Link
                href="/properties"
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Browse listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => {
              const list = o.list_price ?? o.price;
              const diff =
                list && o.price ? o.price - list : null;
              const diffLabel =
                diff == null
                  ? ''
                  : diff === 0
                  ? 'at list'
                  : diff > 0
                  ? `+$${Math.abs(diff).toLocaleString()} over`
                  : `-$${Math.abs(diff).toLocaleString()} under`;

              const stages = ['OFFER', 'REVIEW', 'ACCEPTED', 'CLOSING'] as const;
              const activeIndex =
                o.status === 'CLOSING'
                  ? 3
                  : o.status === 'ACCEPTED'
                  ? 2
                  : o.status === 'UNDER_REVIEW'
                  ? 1
                  : 0;

              return (
                <div
                  key={o.id}
                  className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-50">
                        {fmt(o.price)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {o.property_address}
                        {o.property_city || o.property_state
                          ? ` • ${o.property_city ?? ''}${
                              o.property_city && o.property_state ? ', ' : ''
                            }${o.property_state ?? ''}`
                          : ''}
                      </div>
                      {list && (
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          List {fmt(list)} {diffLabel && `(${diffLabel})`}
                        </div>
                      )}
                    </div>
                    <span
                      className={
                        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ' +
                        statusColor(o.status)
                      }
                    >
                      {o.status ?? 'SUBMITTED'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {stages.map((stage, idx) => (
                      <div key={stage} className="flex-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            idx <= activeIndex
                              ? 'bg-emerald-500'
                              : 'bg-slate-800'
                          }`}
                        />
                        <div className="mt-1 text-center text-[9px] uppercase tracking-[0.16em] text-slate-500">
                          {stage}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/transaction/${o.id}`}
                    className="mt-3 block rounded-xl border border-emerald-500/60 px-3 py-2 text-center text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/10"
                  >
                    Track transaction
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

