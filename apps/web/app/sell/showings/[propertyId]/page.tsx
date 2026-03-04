// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type ShowingRow = {
  id: string;
  buyer_name: string;
  scheduled_at: string | null;
  tour_type: string;
  status: string;
};

function statusLabel(s: string): string {
  if (s === 'CONFIRMED') return 'Confirmed';
  if (s === 'PENDING') return 'Pending';
  if (s === 'CANCELLED') return 'Cancelled';
  return s;
}

function statusClass(s: string): string {
  if (s === 'CONFIRMED') return 'bg-emerald-500/15 text-emerald-300';
  if (s === 'PENDING') return 'bg-amber-500/15 text-amber-300';
  if (s === 'CANCELLED') return 'bg-slate-600 text-slate-400';
  return 'bg-slate-700/60 text-slate-300';
}

export default function SellShowingsPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.propertyId as string | undefined;
  const [showings, setShowings] = useState<ShowingRow[]>([]);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

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
        fetch(`/api/sell/showings/${propertyId}`),
        supabase.from('properties').select('address').eq('id', propertyId).maybeSingle(),
      ]);
      if (propRes.data) setAddress((propRes.data as { address: string | null })?.address ?? '');
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Failed to load showings');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setShowings(data.showings ?? []);
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const handleConfirm = async (showingId: string) => {
    if (!propertyId) return;
    setActing(showingId);
    try {
      const res = await fetch(`/api/sell/showings/${propertyId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showingId, action: 'confirm' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ?? 'Failed to confirm');
        setActing(null);
        return;
      }
      setShowings((prev) => prev.map((s) => (s.id === showingId ? { ...s, status: 'CONFIRMED' } : s)));
    } finally {
      setActing(null);
    }
  };

  const handleCancel = async (showingId: string) => {
    if (!propertyId) return;
    setActing(showingId);
    try {
      const res = await fetch(`/api/sell/showings/${propertyId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showingId, action: 'cancel' }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ?? 'Failed to cancel');
        setActing(null);
        return;
      }
      setShowings((prev) => prev.map((s) => (s.id === showingId ? { ...s, status: 'CANCELLED' } : s)));
    } finally {
      setActing(null);
    }
  };

  const fmtDateTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
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
        <h1 className="text-xl font-semibold text-slate-50">Showings</h1>
        <p className="mt-1 text-sm text-slate-400">{address || propertyId}</p>

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
        ) : showings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm text-slate-400">No showings scheduled for this property.</p>
            <Link href="/sell/dashboard" className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {showings.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-100">{s.buyer_name}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(s.status)}`}>
                    {statusLabel(s.status)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {fmtDateTime(s.scheduled_at)} · {s.tour_type === 'VIRTUAL' ? 'Virtual' : 'In-person'}
                </div>
                {s.status === 'PENDING' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => handleConfirm(s.id)}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {acting === s.id ? 'Confirming…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => handleCancel(s.id)}
                      className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                    >
                      {acting === s.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
