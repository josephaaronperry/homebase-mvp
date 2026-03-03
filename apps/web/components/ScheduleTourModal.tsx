'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Props = {
  propertyId: string | number;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  onClose: () => void;
};

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getNext30Weekdays(): Date[] {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let count = 0;
  const d = new Date(start);
  while (count < 30) {
    if (!isWeekend(d)) {
      out.push(new Date(d));
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

type Step = 'form' | 'success';

export function ScheduleTourModal({
  propertyId,
  propertyAddress,
  propertyCity,
  propertyState,
  onClose,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>('');
  const [tourType, setTourType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [insertedShowing, setInsertedShowing] = useState<{
    id: string;
    scheduled_at: string;
    tour_type: string;
  } | null>(null);

  const dates = useMemo(() => getNext30Weekdays(), []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!date || !time) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const [hours, minutes] = time.split(':').map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hours, minutes, 0, 0);

      setSubmitting(true);
      const { data, error } = await supabase
        .from('showings')
        .insert({
          user_id: user.id,
          property_id: propertyId,
          property_address: propertyAddress ?? '',
          property_city: propertyCity ?? '',
          property_state: propertyState ?? '',
          scheduled_at: scheduledAt.toISOString(),
          status: 'PENDING',
          tour_type: tourType,
          notes: notes.trim() || null,
        })
        .select('id, scheduled_at, tour_type')
        .single();

      setSubmitting(false);
      if (error) {
        alert(error.message ?? 'Failed to schedule tour');
        return;
      }
      setInsertedShowing(data as { id: string; scheduled_at: string; tour_type: string });
      setStep('success');
    },
    [
      date,
      time,
      tourType,
      notes,
      propertyId,
      propertyAddress,
      propertyCity,
      propertyState,
      router,
    ]
  );

  const handleViewShowings = () => {
    onClose();
    router.push('/showings');
  };

  if (step === 'success' && insertedShowing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
              ✓
            </div>
          </div>
          <h2 className="text-center text-lg font-semibold text-slate-50">
            Tour scheduled
          </h2>
          <p className="mt-2 text-center text-sm text-slate-300">
            Your showing request has been submitted. We&apos;ll confirm shortly.
          </p>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-200">
            <div className="font-medium text-slate-50">{propertyAddress}</div>
            <div className="mt-1 text-slate-400">
              {propertyCity}, {propertyState}
            </div>
            <div className="mt-2">
              {new Date(insertedShowing.scheduled_at).toLocaleString()}
            </div>
            <div className="mt-1 capitalize text-slate-500">
              {insertedShowing.tour_type?.toLowerCase().replace('_', ' ')}
            </div>
          </div>
          <button
            type="button"
            onClick={handleViewShowings}
            className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            View my showings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">Schedule a tour</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Date (next 30 weekdays)
            </label>
            <select
              required
              value={date?.toISOString().slice(0, 10) ?? ''}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-400"
            >
              <option value="">Select date</option>
              {dates.map((d) => (
                <option key={d.toISOString()} value={d.toISOString().slice(0, 10)}>
                  {d.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Time (9am–5pm)
            </label>
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-400"
            >
              <option value="">Select time</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t === '12:00'
                    ? '12:00 PM'
                    : parseInt(t, 10) < 12
                      ? `${parseInt(t, 10)}:00 AM`
                      : `${parseInt(t, 10) - 12}:00 PM`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Tour type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTourType('IN_PERSON')}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  tourType === 'IN_PERSON'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setTourType('VIRTUAL')}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  tourType === 'VIRTUAL'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Special requests, accessibility needs..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 outline-none ring-emerald-500/60 focus:border-emerald-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-70"
            >
              {submitting ? 'Scheduling…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
