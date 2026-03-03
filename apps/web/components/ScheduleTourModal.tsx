'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

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

export function ScheduleTourModal({
  propertyId,
  propertyAddress,
  propertyCity,
  propertyState,
  onClose,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>('');
  const [tourType, setTourType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const inserted = data as { id: string; scheduled_at: string; tour_type: string };
      onClose();
      router.push(`/showings/${inserted.id}/confirmed`);
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
      onClose,
    ]
  );

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
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Date (next 30 weekdays)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {dates.map((d) => {
                const key = d.toISOString().slice(0, 10);
                const isWeekendDay = isWeekend(d);
                const selected = date?.toISOString().slice(0, 10) === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isWeekendDay}
                    onClick={() => !isWeekendDay && setDate(new Date(d))}
                    className={`rounded-lg py-2 text-[11px] font-medium ${
                      isWeekendDay
                        ? 'cursor-not-allowed bg-slate-900/50 text-slate-600'
                        : selected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            {date && (
              <p className="mt-1.5 text-[11px] text-slate-500">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
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
