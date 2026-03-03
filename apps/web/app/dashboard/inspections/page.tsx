'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

const MOCK_INSPECTORS = [
  { id: 'insp-1', name: 'SafeHome Inspections', rating: 4.9, price: 425 },
  { id: 'insp-2', name: 'Eagle Eye Home Inspections', rating: 4.8, price: 395 },
  { id: 'insp-3', name: 'ThoroughCheck Pro', rating: 5.0, price: 499 },
];

const TIME_SLOTS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

function next30Weekdays(): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < 30; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    if (day.getDay() >= 1 && day.getDay() <= 5) out.push(day);
  }
  return out;
}

type Pipeline = {
  id: string;
  property_id: string;
};

export default function InspectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [propertyAddress, setPropertyAddress] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedInspector, setSelectedInspector] = useState<(typeof MOCK_INSPECTORS)[number] | null>(null);

  const weekdays = next30Weekdays();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      if (propertyId) {
        const [pipeRes, propRes] = await Promise.all([
          supabase.from('buying_pipelines').select('id, property_id').eq('user_id', user.id).eq('property_id', propertyId).maybeSingle(),
          supabase.from('properties').select('address').eq('id', propertyId).maybeSingle(),
        ]);
        if (pipeRes.error || propRes.error) setError(pipeRes.error?.message ?? propRes.error?.message ?? 'Failed to load');
        else {
          setPipeline((pipeRes.data ?? null) as Pipeline | null);
          setPropertyAddress((propRes.data as { address: string } | null)?.address ?? null);
        }
      }
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const handleSubmit = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !pipeline || !selectedDate || !selectedSlot || !selectedInspector) return;
    setSubmitting(true);
    const { error } = await supabase.from('inspections').insert({
      user_id: user.id,
      buying_pipeline_id: pipeline.id,
      inspector_name: selectedInspector.name,
      inspector_rating: selectedInspector.rating,
      price: selectedInspector.price,
      scheduled_date: selectedDate,
      time_slot: selectedSlot,
    });
    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }
    const completedRes = await supabase.from('buying_pipelines').select('stage_completed_at').eq('id', pipeline.id).single();
    const completed = (completedRes.data as { stage_completed_at: Record<string, string> } | null)?.stage_completed_at ?? {};
    const nextCompleted = { ...completed, inspection_booked: new Date().toISOString() };
    await supabase
      .from('buying_pipelines')
      .update({
        current_stage: 'inspection_booked',
        stage_completed_at: nextCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pipeline.id);
    setSubmitting(false);
    router.replace(propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard');
  }, [pipeline, selectedDate, selectedSlot, selectedInspector, propertyId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-2xl px-4 py-8">
          <Link href={propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard'} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">← {propertyId ? 'Pipeline' : 'Dashboard'}</Link>
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href={propertyId ? `/dashboard/buying/${propertyId}` : '/dashboard'}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400"
        >
          ← {propertyId ? 'Pipeline' : 'Dashboard'}
        </Link>
        <h1 className="text-xl font-semibold text-slate-50">Book inspection</h1>
        <p className="mt-1 text-sm text-slate-400">
          Choose a date (weekdays, next 30 days), time slot, and inspector.
        </p>
        {propertyAddress && (
          <p className="mt-2 text-xs text-slate-500">Property: {propertyAddress}</p>
        )}

        {propertyId && !pipeline && (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            No buying pipeline for this property. Start from your pipeline first.
            <Link href="/dashboard" className="mt-2 block font-semibold text-amber-200 hover:text-amber-100">
              Back to dashboard
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Date (weekdays only)</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {weekdays.slice(0, 20).map((d) => {
                const key = d.toISOString().slice(0, 10);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      selectedDate === key
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-300">Time slot</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    selectedSlot === slot
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-300">Inspector</h2>
            <div className="mt-3 space-y-3">
              {MOCK_INSPECTORS.map((insp) => (
                <button
                  key={insp.id}
                  type="button"
                  onClick={() => setSelectedInspector(insp)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                    selectedInspector?.id === insp.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-50">{insp.name}</p>
                    <p className="text-xs text-slate-400">★ {insp.rating} rating</p>
                  </div>
                  <p className="font-semibold text-emerald-400">${insp.price}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!pipeline || !selectedDate || !selectedSlot || !selectedInspector || submitting}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {submitting ? 'Booking…' : 'Book inspection'}
          </button>
        </div>
      </main>
    </div>
  );
}
