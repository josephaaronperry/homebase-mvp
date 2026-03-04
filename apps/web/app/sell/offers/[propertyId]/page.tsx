// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type OfferRow = {
  id: string;
  buyer_name: string;
  amount: number | null;
  status: string;
  financing_type: string | null;
  closing_date: string | null;
  message_to_seller: string | null;
  created_at: string | null;
};

function statusLabel(s: string): string {
  if (s === 'PENDING') return 'PENDING';
  if (s === 'ACCEPTED') return 'ACCEPTED';
  if (s === 'REJECTED') return 'REJECTED';
  return s;
}

function statusClass(s: string): string {
  if (s === 'PENDING') return 'bg-amber-500/15 text-amber-300';
  if (s === 'ACCEPTED') return 'bg-emerald-500/15 text-emerald-300';
  if (s === 'REJECTED') return 'bg-slate-600 text-slate-400';
  return 'bg-slate-700/60 text-slate-300';
}

export default function SellOffersPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.propertyId as string | undefined;
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const hasAccepted = offers.some((o) => o.status === 'ACCEPTED');
  const canActOnOffer = (o: OfferRow) => o.status === 'PENDING' && !hasAccepted;

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      const [res, propRes] = await Promise.all([
        fetch(`/api/sell/offers/${propertyId}`),
        supabase.from('properties').select('address').eq('id', propertyId).maybeSingle(),
      ]);
      if (propRes.data) {
        setAddress((propRes.data as { address: string | null })?.address ?? '');
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Failed to load offers');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOffers(data.offers ?? []);
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAccept = async (offerId: string) => {
    if (!propertyId) return;
    setActing(offerId);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/offers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, propertyId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ?? 'Failed to accept offer');
        setActing(null);
        return;
      }
      setSuccessMessage('Offer accepted. The buyer has been notified.');
      const [listRes] = await Promise.all([
        fetch(`/api/sell/offers/${propertyId}`),
      ]);
      if (listRes.ok) {
        const data = await listRes.json();
        setOffers(data.offers ?? []);
      }
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (offerId: string) => {
    if (!propertyId) return;
    setActing(offerId);
    try {
      const res = await fetch(`/api/sell/offers/${propertyId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ?? 'Failed to reject offer');
        setActing(null);
        return;
      }
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'REJECTED' } : o)));
    } finally {
      setActing(null);
    }
  };

  if (!propertyId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <p className="text-slate-400">Invalid property.</p>
          <Link href="/sell/dashboard" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">← Seller dashboard</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/sell/dashboard" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Seller dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-50">Offers</h1>
        <p className="mt-1 text-sm text-slate-400">{address || propertyId}</p>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-slate-400">No offers yet. Share your listing to attract buyers.</p>
            <Link href="/sell/dashboard" className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <>
            {successMessage && (
              <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {successMessage}
              </div>
            )}
          <div className="mt-6 space-y-4">
            {offers.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-100">{o.buyer_name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 sm:grid-cols-4">
                  <span>Offer: {o.amount != null ? `$${Number(o.amount).toLocaleString()}` : '—'}</span>
                  <span>Financing: {o.financing_type ?? '—'}</span>
                  <span>Closing: {o.closing_date ?? '—'}</span>
                  <span>Submitted: {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</span>
                </div>
                {o.message_to_seller && (
                  <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-300">
                    Message: {o.message_to_seller}
                  </p>
                )}
                {canActOnOffer(o) && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => handleAccept(o.id)}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {acting === o.id ? 'Accepting…' : 'Accept offer'}
                    </button>
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => handleReject(o.id)}
                      className="rounded-xl border border-rose-500/60 bg-transparent px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      {acting === o.id ? 'Rejecting…' : 'Reject offer'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </main>
    </div>
  );
}
