'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['admin@homebase.com', 'admin@example.com'];

type KycRow = {
  id: string;
  user_id: string;
  status: string;
  full_name: string | null;
  submitted_at: string | null;
};

type OfferRow = {
  id: string;
  user_id: string;
  status: string | null;
  price: number | null;
  property_address: string | null;
};

type ShowingRow = {
  id: string;
  user_id: string;
  status: string | null;
  property_address: string | null;
  scheduled_at: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [kyc, setKyc] = useState<KycRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [showings, setShowings] = useState<ShowingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kyc' | 'offers' | 'showings'>('kyc');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (!ADMIN_EMAILS.includes(user.email ?? '')) {
        router.replace('/dashboard');
        return;
      }
      setEmail(user.email ?? null);

      const [kycRes, offersRes, showingsRes] = await Promise.all([
        supabase.from('kyc_submissions').select('id, user_id, status, full_name, submitted_at').order('created_at', { ascending: false }),
        supabase.from('offers').select('id, user_id, status, price, property_address').order('created_at', { ascending: false }),
        supabase.from('showings').select('id, user_id, status, property_address, scheduled_at').order('scheduled_at', { ascending: false }),
      ]);

      setKyc((kycRes.data ?? []) as KycRow[]);
      setOffers((offersRes.data ?? []) as OfferRow[]);
      setShowings((showingsRes.data ?? []) as ShowingRow[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const updateKyc = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await supabase.from('kyc_submissions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    setKyc((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const updateOffer = async (id: string, status: string) => {
    await supabase.from('offers').update({ status }).eq('id', id);
    setOffers((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const updateShowing = async (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    await supabase.from('showings').update({ status }).eq('id', id);
    setShowings((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-slate-50">Admin</h1>
        <p className="mt-1 text-sm text-slate-400">{email}</p>

        <div className="mt-6 flex gap-2 border-b border-slate-800 pb-2">
          {(['kyc', 'offers', 'showings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
                activeTab === tab ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'kyc' && (
          <div className="mt-6 space-y-3">
            {kyc.length === 0 ? (
              <p className="text-sm text-slate-500">No KYC submissions.</p>
            ) : (
              kyc.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">{r.full_name ?? r.id}</div>
                    <div className="text-xs text-slate-500">{r.status} • {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</div>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateKyc(r.id, 'APPROVED')}
                        className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateKyc(r.id, 'REJECTED')}
                        className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="mt-6 space-y-3">
            {offers.length === 0 ? (
              <p className="text-sm text-slate-500">No offers.</p>
            ) : (
              offers.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      ${r.price?.toLocaleString() ?? '—'} • {r.property_address ?? r.id}
                    </div>
                    <div className="text-xs text-slate-500">{r.status}</div>
                  </div>
                  <select
                    value={r.status ?? ''}
                    onChange={(e) => updateOffer(r.id, e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'showings' && (
          <div className="mt-6 space-y-3">
            {showings.length === 0 ? (
              <p className="text-sm text-slate-500">No showings.</p>
            ) : (
              showings.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-100">{r.property_address ?? r.id}</div>
                    <div className="text-xs text-slate-500">
                      {r.status} • {r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : '—'}
                    </div>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateShowing(r.id, 'CONFIRMED')}
                        className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => updateShowing(r.id, 'CANCELLED')}
                        className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
