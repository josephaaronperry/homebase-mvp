'use client';

import { useState } from 'react';

const MIN_PRICE = 100_000;
const MAX_PRICE = 2_000_000;
const STEP = 25_000;
const FLAT_FEE = 4_000;
const COMMISSION_RATE = 0.06;

export function SavingsCalculator() {
  const [price, setPrice] = useState(500_000);
  const agentCost = Math.round(price * COMMISSION_RATE);
  const savings = Math.max(0, agentCost - FLAT_FEE);

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl shadow-black/60 backdrop-blur sm:p-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
        See your savings
      </h2>
      <p className="mt-1 text-slate-200 text-sm">
        Move the slider to your home price. Compare traditional agent cost vs HomeBase.
      </p>
      <div className="mt-6">
        <label htmlFor="savings-price" className="sr-only">
          Home price
        </label>
        <input
          id="savings-price"
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={STEP}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-emerald-500"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>${(MIN_PRICE / 1000).toFixed(0)}k</span>
          <span className="font-semibold text-slate-50">
            ${(price / 1000).toFixed(0)}k
          </span>
          <span>${(MAX_PRICE / 1000).toFixed(0)}k</span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-600/80 bg-slate-900/60 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Traditional agent cost
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-200">
            ${agentCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">6% of price</div>
        </div>
        <div className="rounded-xl border border-slate-600/80 bg-slate-900/60 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            HomeBase cost
          </div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            $4,000 flat
          </div>
          <div className="text-[11px] text-slate-500">One flat fee</div>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400/90">
            You save
          </div>
          <div className="mt-1 text-xl font-semibold text-emerald-300">
            ${savings.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
