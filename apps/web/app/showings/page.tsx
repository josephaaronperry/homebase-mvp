'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Showing = {
  id: string | number;
  property_address?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  tour_type?: string | null;
};

export default function ShowingsPage() {
  const router = useRouter();
  const [showings, setShowings] = useState<Showing[]>([]);
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
      const { data, error: err } = await supabase
        .from('showings')
        .select('id, property_address, property_city, property_state, scheduled_at, status, tour_type')
        .order('scheduled_at', { ascending: true });
      if (err) setError(err.message ?? 'Failed to load showings');
      else setShowings((data ?? []) as Showing[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const statusBadge = (status?: string | null) => {
    if (status === 'CONFIRMED') return 'bg-emerald-500/15 text-emerald-300';
    if (status === 'PENDING') return 'bg-sky-500/15 text-sky-300';
    if (status === 'CANCELLED') return 'bg-rose-500/15 text-rose-300';
    return 'bg-slate-700/60 text-slate-200';
  };

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : '—';

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
          Showings
        </h1>
      </header>

      <main className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/40">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Scheduled tours
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Upcoming and past home tours in one place.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
              />
            ))}
          </div>
        ) : showings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="mb-3 text-4xl">📅</div>
            <p>No showings scheduled yet.</p>
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
            {showings.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-50">
                    {s.property_address}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {s.property_city}, {s.property_state}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {fmtDate(s.scheduled_at)}
                  </div>
                  {s.tour_type && (
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                      {s.tour_type === 'VIRTUAL' ? 'Virtual' : 'In-person'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ' +
                      statusBadge(s.status)
                    }
                  >
                    {s.status ?? 'SCHEDULED'}
                  </span>
                  {s.status !== 'CANCELLED' && (
                    <button
                      onClick={async () => {
                        await supabase
                          .from('showings')
                          .update({ status: 'CANCELLED' })
                          .eq('id', s.id);
                        setShowings((prev) =>
                          prev.map((row) =>
                            row.id === s.id
                              ? { ...row, status: 'CANCELLED' }
                              : row,
                          ),
                        );
                      }}
                      className="rounded-full border border-rose-500/60 px-3 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

