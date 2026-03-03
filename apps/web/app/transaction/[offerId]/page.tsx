'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Stage = {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: 'completed' | 'active' | 'upcoming';
};

const STAGES: Omit<Stage, 'status'>[] = [
  { id: 'submitted', title: 'Offer Submitted', description: 'Your offer has been sent to the seller for review.', timeframe: 'Day 1' },
  { id: 'review', title: 'Under Review', description: 'The seller is reviewing your offer and may respond with questions or a counter.', timeframe: '1–3 days' },
  { id: 'accepted', title: 'Offer Accepted', description: 'Congratulations! The seller has accepted your offer. Next up: inspections and financing.', timeframe: 'Day 3–5' },
  { id: 'inspection', title: 'Inspection Scheduled', description: 'Home inspection is scheduled. A licensed inspector will evaluate the property.', timeframe: '1–2 weeks' },
  { id: 'inspection_done', title: 'Inspection Complete', description: 'Inspection report received. Review findings and decide on any repair requests.', timeframe: '2–3 days' },
  { id: 'appraisal', title: 'Appraisal', description: 'Lender orders appraisal to confirm property value. Required for most loans.', timeframe: '1–2 weeks' },
  { id: 'clear', title: 'Clear to Close', description: 'All conditions met. Final paperwork and closing date are being coordinated.', timeframe: '3–5 days' },
  { id: 'closing', title: 'Closing Day', description: 'Sign documents, transfer funds, and receive the keys to your new home.', timeframe: 'Closing day' },
  { id: 'keys', title: 'Keys in Hand', description: 'You\'re a homeowner! Enjoy your new space.', timeframe: '—' },
];

function deriveStages(offerStatus: string | null): Stage[] {
  const statusToIndex: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
    ACCEPTED: 2,
    INSPECTION_SCHEDULED: 3,
    INSPECTION_COMPLETE: 4,
    APPRAISAL: 5,
    CLEAR_TO_CLOSE: 6,
    CLOSING: 7,
    KEYS: 8,
  };
  const idx = offerStatus ? (statusToIndex[offerStatus] ?? 0) : 0;
  return STAGES.map((s, i) => ({
    ...s,
    status: i < idx ? ('completed' as const) : i === idx ? ('active' as const) : ('upcoming' as const),
  }));
}

type Offer = {
  id: string;
  price: number | null;
  status: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
};

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params?.offerId as string;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('offers')
        .select('id, price, status, property_address, property_city, property_state')
        .eq('id', offerId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) {
        setOffer(null);
      } else {
        setOffer(data as Offer);
      }
      setLoading(false);
    };
    if (offerId) load();
  }, [offerId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
        <p className="text-lg font-semibold">Transaction not found</p>
        <Link href="/offers" className="mt-4 text-emerald-400 hover:text-emerald-300">
          ← Back to offers
        </Link>
      </div>
    );
  }

  const stages = deriveStages(offer.status);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/offers"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400"
        >
          ← Offers
        </Link>

        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-50">Transaction timeline</h1>
          <p className="mt-1 text-sm text-slate-400">
            {offer.property_address}
            {offer.property_city || offer.property_state
              ? ` • ${offer.property_city ?? ''}${offer.property_city && offer.property_state ? ', ' : ''}${offer.property_state ?? ''}`
              : ''}
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-400">
            ${offer.price?.toLocaleString() ?? '—'}
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    stage.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : stage.status === 'active'
                        ? 'bg-emerald-500/30 text-emerald-300 ring-4 ring-emerald-500/20 animate-pulse'
                        : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  {stage.status === 'completed' ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`mt-1 h-16 w-0.5 flex-1 ${
                      stage.status === 'completed' ? 'bg-emerald-500/40' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
              <div
                className={`pb-8 ${
                  stage.status === 'active'
                    ? 'rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4'
                    : stage.status === 'upcoming'
                      ? 'opacity-60'
                      : ''
                }`}
              >
                <div className="text-sm font-semibold text-slate-50">{stage.title}</div>
                <div className="mt-1 text-xs text-slate-400">{stage.description}</div>
                <div className="mt-1 text-[11px] text-slate-500">{stage.timeframe}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Documents section */}
        <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-sm font-semibold text-slate-50">Documents</h2>
          <p className="mt-1 text-xs text-slate-400">
            Required documents at each stage. Upload or download as needed.
          </p>
          <div className="mt-4 space-y-2">
            {[
              { name: 'Purchase agreement', status: 'Pending' },
              { name: 'Earnest money receipt', status: 'Pending' },
              { name: 'Inspection report', status: 'Pending' },
              { name: 'Appraisal', status: 'Pending' },
              { name: 'Closing disclosure', status: 'Pending' },
            ].map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <span className="text-sm text-slate-200">{d.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Messages/notes */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-sm font-semibold text-slate-50">Updates from HomeBase</h2>
          <p className="mt-1 text-xs text-slate-400">
            Important updates and notes from our team.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <p className="text-xs text-slate-300">
                Your offer has been submitted. We&apos;ll notify you as soon as the seller responds.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                {new Date().toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-slate-500">No additional updates yet.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
