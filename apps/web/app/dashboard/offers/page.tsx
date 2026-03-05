// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type OfferRow = {
  id: string;
  property_id: string | null;
  price: number | null;
  status: string | null;
  created_at: string | null;
};

type PropertyMap = Record<string, { address: string | null }>;

function statusLabel(s: string | null): string {
  if (s === 'PENDING') return 'PENDING';
  if (s === 'ACCEPTED') return 'ACCEPTED';
  if (s === 'REJECTED') return 'REJECTED';
  if (s === 'WITHDRAWN') return 'WITHDRAWN';
  return s ?? '—';
}

function statusClass(s: string | null): string {
  if (s === 'PENDING') return 'bg-amber-100 text-amber-800';
  if (s === 'ACCEPTED') return 'bg-[#1B4332]/15 text-[#1B4332]';
  if (s === 'REJECTED') return 'bg-rose-100 text-rose-700';
  if (s === 'WITHDRAWN') return 'bg-[#E8E6E1] text-[#4A4A4A]';
  return 'bg-[#F4F3F0] text-[#4A4A4A]';
}

export default function DashboardOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [propertyMap, setPropertyMap] = useState<PropertyMap>({});
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
      const { data: offersData, error: offersErr } = await supabase
        .from('offers')
        .select('id, property_id, offerPrice, status, createdAt')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });
      if (offersErr) {
        setError(offersErr.message ?? 'Failed to load offers');
        setLoading(false);
        return;
      }
      const raw = (offersData ?? []) as { id: string; property_id: string | null; offerPrice: number | null; status: string | null; createdAt: string | null }[];
      const list: OfferRow[] = raw.map((o) => ({ id: o.id, property_id: o.property_id, price: o.offerPrice, status: o.status, created_at: o.createdAt }));
      setOffers(list);
      const ids = [...new Set(list.map((o) => o.property_id).filter(Boolean))] as string[];
      if (ids.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, address')
          .in('id', ids);
        const map: PropertyMap = {};
        for (const p of props ?? []) {
          map[(p as { id: string }).id] = { address: (p as { address: string | null }).address };
        }
        setPropertyMap(map);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-block text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">
          ← Dashboard
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">My offers</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">Track your offers and pipeline.</p>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#F4F3F0]" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-[#4A4A4A]">No offers yet. Browse homes to get started.</p>
            <Link href="/properties" className="mt-4 inline-block rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D5A47]">
              Browse homes
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {offers.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-[#E8E6E1] bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-[#1A1A1A]">
                    {o.property_id ? (propertyMap[o.property_id]?.address ?? 'Property') : 'Property'}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-[family-name:var(--font-mono)] text-xs text-[#4A4A4A]">
                  <span>Offer: {o.price != null ? `$${Number(o.price).toLocaleString()}` : '—'}</span>
                  <span>Submitted: {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div className="mt-3">
                  {o.status === 'ACCEPTED' && o.property_id ? (
                    <Link
                      href={`/dashboard/buying/${o.property_id}`}
                      className="inline-block text-xs font-semibold text-[#52B788] hover:text-[#1B4332]"
                    >
                      View pipeline →
                    </Link>
                  ) : o.status === 'PENDING' ? (
                    <span className="text-xs text-[#4A4A4A]">Awaiting response</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
