'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Showing = {
  id: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  scheduled_at: string | null;
  tour_type: string | null;
  status: string | null;
};

export default function ShowingConfirmedPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [showing, setShowing] = useState<Showing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=/showings/${id}/confirmed`);
        return;
      }
      const { data, error } = await supabase
        .from('showings')
        .select('id, property_address, property_city, property_state, scheduled_at, tour_type, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) {
        setShowing(null);
      } else {
        setShowing(data as Showing);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleAddToCalendar = useCallback(() => {
    if (!showing?.scheduled_at) return;
    const start = new Date(showing.scheduled_at);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `Home tour: ${showing.property_address ?? 'Property'}`;
    const desc = `${showing.property_address ?? ''}, ${showing.property_city ?? ''}, ${showing.property_state ?? ''}`.trim();
    const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').slice(0, 15);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HomeBase//Tour//EN',
      'BEGIN:VEVENT',
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homebase-tour-${id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [showing, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (!showing) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 text-center">
          <p className="text-slate-400">Showing not found or you don’t have access.</p>
          <Link href="/showings" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">View all showings</Link>
        </main>
      </div>
    );
  }

  const dateTime = showing.scheduled_at
    ? new Date(showing.scheduled_at).toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBD';
  const tourType = (showing.tour_type ?? 'IN_PERSON').toLowerCase().replace('_', ' ');

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
              ✓
            </div>
          </div>
          <h1 className="text-xl font-semibold text-slate-50">Tour confirmed</h1>
          <p className="mt-2 text-sm text-slate-400">Your showing request has been submitted.</p>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left text-sm">
            <div className="font-medium text-slate-50">{showing.property_address}</div>
            <div className="text-slate-400">{showing.property_city}, {showing.property_state}</div>
            <div className="mt-2 text-slate-200">{dateTime}</div>
            <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-300">
              {tourType}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              Add to calendar
            </button>
            <Link
              href="/showings"
              className="block w-full rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              View all showings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
