// SPEC-2: Buyer Offers Dashboard - Schema verified against SCHEMA.md
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type OfferWithProperty = {
  id: string;
  property_id: string | null;
  offerPrice: number | null;
  status: string | null;
  createdAt: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  image_url: string | null;
  dealId: string | null;
};

function statusBadgeClass(s: string | null): string {
  if (s === 'PENDING' || s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'ACCEPTED') return 'bg-[#D1FAE5] text-[#065F46]';
  if (s === 'REJECTED' || s === 'DECLINED') return 'bg-[#FEE2E2] text-[#991B1B]';
  if (s === 'COUNTERED') return 'bg-[#EDE9FE] text-[#5B21B6]';
  if (s === 'WITHDRAWN') return 'bg-[#F3F4F6] text-[#6B7280]';
  return 'bg-[#F4F3F0] text-[#4A4A4A]';
}

function statusLabel(s: string | null): string {
  if (s === 'PENDING' || s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'Pending';
  if (s === 'ACCEPTED') return 'Accepted';
  if (s === 'REJECTED' || s === 'DECLINED') return 'Declined';
  if (s === 'COUNTERED') return 'Countered';
  if (s === 'WITHDRAWN') return 'Withdrawn';
  return s ?? '—';
}

export default function DashboardOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithProperty[]>([]);
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
      const list = (offersData ?? []) as { id: string; property_id: string | null; offerPrice: number | null; status: string | null; createdAt: string | null }[];
      const propertyIds = [...new Set(list.map((o) => o.property_id).filter(Boolean))] as string[];
      let propertyMap: Record<string, { address: string | null; city: string | null; state: string | null; price: number | null; image_url: string | null }> = {};
      if (propertyIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, address, city, state, price, image_url')
          .in('id', propertyIds);
        for (const p of props ?? []) {
          const row = p as { id: string; address: string | null; city: string | null; state: string | null; price: number | null; image_url: string | null };
          propertyMap[row.id] = { address: row.address, city: row.city, state: row.state, price: row.price, image_url: row.image_url };
        }
      }
      const { data: dealsData } = await supabase
        .from('deals')
        .select('id, offer_id')
        .eq('buyer_id', user.id);
      const dealByOfferId = new Map<string, string>();
      for (const d of dealsData ?? []) {
        const row = d as { id: string; offer_id: string };
        dealByOfferId.set(row.offer_id, row.id);
      }
      setOffers(
        list.map((o) => {
          const prop = o.property_id ? propertyMap[o.property_id] : null;
          return {
            id: o.id,
            property_id: o.property_id,
            offerPrice: o.offerPrice,
            status: o.status,
            createdAt: o.createdAt,
            address: prop?.address ?? null,
            city: prop?.city ?? null,
            state: prop?.state ?? null,
            price: prop?.price ?? null,
            image_url: prop?.image_url ?? null,
            dealId: dealByOfferId.get(o.id) ?? null,
          };
        })
      );
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
        <h1 className="font-display text-2xl font-semibold text-[#1A1A1A]">My offers</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">Track your offers and next steps.</p>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
          </div>
        ) : offers.length === 0 ? (
          <motion.div
            className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.p
              className="text-5xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🏡
            </motion.p>
            <p className="mt-4 font-medium text-[#1A1A1A]">No offers yet</p>
            <p className="mt-1 text-sm text-[#4A4A4A]">When you submit an offer on a home, it will appear here.</p>
            <Link href="/properties" className="mt-6 inline-block rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2D6A4F]">
              Browse homes →
            </Link>
          </motion.div>
        ) : (
          <div className="mt-6 space-y-4">
            {offers.map((o, i) => (
              <motion.div
                key={o.id}
                className="flex gap-4 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#F4F3F0]">
                  {o.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-[#888888]">🏠</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">
                        {o.address ?? 'Property'}
                        {(o.city || o.state) && (
                          <span className="text-[#4A4A4A]"> — {[o.city, o.state].filter(Boolean).join(', ')}</span>
                        )}
                      </p>
                      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm text-[#1A1A1A]">
                        Offer: {o.offerPrice != null ? `$${Number(o.offerPrice).toLocaleString()}` : '—'}
                      </p>
                      <p className="text-xs text-[#888888]">
                        Submitted {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <motion.span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(o.status)}`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {statusLabel(o.status)}
                    </motion.span>
                  </div>
                  <div className="mt-3">
                    {o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'UNDER_REVIEW' ? (
                      <span className="text-sm text-[#888888]">Awaiting seller response</span>
                    ) : o.status === 'ACCEPTED' ? (
                      <Link
                        href={o.dealId ? `/lenders?dealId=${o.dealId}` : `/dashboard/lenders?propertyId=${o.property_id}`}
                        className="inline-block rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
                      >
                        Select your lender →
                      </Link>
                    ) : o.status === 'REJECTED' || o.status === 'DECLINED' ? (
                      <Link href="/properties" className="text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F]">
                        View other homes →
                      </Link>
                    ) : o.status === 'COUNTERED' ? (
                      <Link
                        href={`/dashboard/offers/${o.id}`}
                        className="inline-block rounded-xl border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-semibold text-[#1A1A1A] hover:border-[#1B4332]"
                      >
                        Review counter offer →
                      </Link>
                    ) : o.status === 'WITHDRAWN' ? (
                      o.property_id ? (
                        <Link
                          href={`/properties/${o.property_id}`}
                          className="text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F]"
                        >
                          Resubmit offer →
                        </Link>
                      ) : (
                        <Link href="/properties" className="text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F]">
                          Browse homes →
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
