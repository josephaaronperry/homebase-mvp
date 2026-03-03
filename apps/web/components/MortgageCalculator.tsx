'use client';

import { useMemo, useState } from 'react';

type Props = {
  price: number;
};

export function MortgageCalculator({ price }: Props) {
  const [homePrice, setHomePrice] = useState(price || 750_000);
  const [downPayment, setDownPayment] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(30);

  const monthly = useMemo(() => {
    const principal = homePrice * (1 - downPayment / 100);
    const n = years * 12;
    const r = rate / 100 / 12;
    if (!principal || !n || !r) return 0;
    const m = (principal * r) / (1 - Math.pow(1 + r, -n));
    return Math.round(m);
  }, [downPayment, homePrice, rate, years]);

  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-950/90 p-4 text-xs text-slate-200">
      <div className="mb-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Mortgage estimate
        </div>
        <div className="mt-1 text-xl font-semibold text-slate-50">
          {monthly ? `$${monthly.toLocaleString()}/mo` : '—'}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Principal &amp; interest only. Taxes and insurance not included.
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Home price
          </label>
          <input
            type="number"
            value={homePrice}
            onChange={(e) => setHomePrice(Number(e.target.value) || 0)}
            className="h-8 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Down payment %
            </label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
              className="h-8 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Rate %
            </label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
              className="h-8 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Term (years)
          </label>
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value) || 30)}
            className="h-8 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 focus:border-emerald-400"
          >
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>
      </div>
    </div>
  );
}

