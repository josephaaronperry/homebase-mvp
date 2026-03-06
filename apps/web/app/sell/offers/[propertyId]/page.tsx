// SPEC-3: Seller Offer Management - Schema verified against SCHEMA.md
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ToastProvider';

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

function statusBadgeClass(s: string): string {
  if (s === 'PENDING' || s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'bg-[#FEF3C7] text-[#92400E]';
  if (s === 'ACCEPTED') return 'bg-[#D1FAE5] text-[#065F46]';
  if (s === 'REJECTED' || s === 'DECLINED') return 'bg-[#FEE2E2] text-[#991B1B]';
  if (s === 'COUNTERED') return 'bg-[#EDE9FE] text-[#5B21B6]';
  if (s === 'WITHDRAWN') return 'bg-[#F3F4F6] text-[#6B7280]';
  return 'bg-[#F4F3F0] text-[#4A4A4A]';
}

function statusLabel(s: string): string {
  if (s === 'PENDING' || s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'Pending';
  if (s === 'ACCEPTED') return 'Accepted';
  if (s === 'REJECTED' || s === 'DECLINED') return 'Declined';
  if (s === 'COUNTERED') return 'Countered';
  if (s === 'WITHDRAWN') return 'Withdrawn';
  return s;
}

function buyerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    return `${parts[0]} ${last.charAt(0)}.`;
  }
  return fullName || 'Buyer';
}

export default function SellOffersPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.propertyId as string | undefined;
  const toast = useToast();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [acceptModal, setAcceptModal] = useState<{ offerId: string; buyerName: string } | null>(null);

  const hasAccepted = offers.some((o) => o.status === 'ACCEPTED');
  const canActOnOffer = (o: OfferRow) => o.status === 'PENDING' || o.status === 'SUBMITTED' || o.status === 'UNDER_REVIEW' ? !hasAccepted : false;

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

  const handleAcceptConfirm = async () => {
    if (!propertyId || !acceptModal) return;
    const { offerId: oid } = acceptModal;
    setActing(oid);
    setAcceptModal(null);
    try {
      const res = await fetch('/api/offers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: oid, propertyId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(j.error ?? 'Failed to accept offer');
        setActing(null);
        return;
      }
      toast('Offer accepted! Deal created.');
      router.push('/sell/dashboard');
    } catch {
      toast('Something went wrong.');
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (offerId: string) => {
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
        toast(j.error ?? 'Failed to decline offer');
        setActing(null);
        return;
      }
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: 'REJECTED' } : o)));
      toast('Offer declined');
    } finally {
      setActing(null);
    }
  };

  if (!propertyId) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAF8]">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <p className="text-[#4A4A4A]">Invalid property.</p>
          <Link href="/sell/dashboard" className="mt-4 inline-block text-[#1B4332] hover:text-[#2D6A4F]">← Seller dashboard</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/sell/dashboard" className="mb-6 inline-block text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">
          ← Seller dashboard
        </Link>
        <h1 className="font-display text-2xl font-semibold text-[#1A1A1A]">{address || 'Property'} — Offers</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">Manage offers for this listing.</p>

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
          <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-[#4A4A4A]">No offers yet on this property. Share your listing to get started.</p>
            <Link href="/sell/dashboard" className="mt-4 inline-block rounded-xl border border-[#E8E6E1] px-4 py-2 text-sm font-semibold text-[#4A4A4A] hover:bg-[#F4F3F0]">
              Back to dashboard
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
                  <p className="font-medium text-[#1A1A1A]">{buyerDisplayName(o.buyer_name)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(o.status)}`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#4A4A4A] sm:grid-cols-4">
                  <span>Offer: {o.amount != null ? `$${Number(o.amount).toLocaleString()}` : '—'}</span>
                  <span>Submitted: {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</span>
                  {o.financing_type && <span>Financing: {o.financing_type}</span>}
                  {o.closing_date && <span>Closing: {o.closing_date}</span>}
                </div>
                {o.message_to_seller && (
                  <p className="mt-3 border-t border-[#E8E6E1] pt-3 text-xs text-[#4A4A4A]">
                    Message: {o.message_to_seller}
                  </p>
                )}
                {canActOnOffer(o) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => setAcceptModal({ offerId: o.id, buyerName: o.buyer_name })}
                      className="rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2D6A4F] disabled:opacity-50"
                    >
                      {acting === o.id ? 'Accepting…' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => handleDecline(o.id)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {acting === o.id ? 'Declining…' : 'Decline'}
                    </button>
                    <Link
                      href={`/sell/offers/${propertyId}/counter?offerId=${o.id}`}
                      className="rounded-xl border border-[#E8E6E1] bg-white px-4 py-2 text-xs font-semibold text-[#4A4A4A] hover:bg-[#F4F3F0]"
                    >
                      Counter
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {acceptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
            <div className="w-full max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-xl">
              <h3 className="font-display text-lg font-semibold text-[#1A1A1A]">Accept this offer?</h3>
              <p className="mt-2 text-sm text-[#4A4A4A]">
                Accept this offer from {buyerDisplayName(acceptModal.buyerName)}? This will decline all other offers automatically.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptModal(null)}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A] hover:bg-[#F4F3F0]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAcceptConfirm}
                  className="flex-1 rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
                >
                  Accept offer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
