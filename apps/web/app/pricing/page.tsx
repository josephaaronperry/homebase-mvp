'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const FEATURES = [
  { feature: 'Full listing access', homebase: true, traditional: true },
  { feature: 'Schedule tours online', homebase: true, traditional: false },
  { feature: 'Digital offers & tracking', homebase: true, traditional: false },
  { feature: 'Identity verification', homebase: true, traditional: false },
  { feature: 'Transaction timeline', homebase: true, traditional: true },
  { feature: 'Buyer fee', homebase: '1%', traditional: 'Often 3% (in price)' },
  { feature: 'Seller fee', homebase: '1%', traditional: '5–6%' },
  { feature: 'Total typical cost (on $500k)', homebase: '$10,000', traditional: '$25,000–30,000' },
];

const FAQ = [
  {
    q: 'When do I pay the 1% fee?',
    a: 'At closing. There are no upfront fees to search, save homes, or schedule tours.',
  },
  {
    q: 'How does HomeBase compare to a traditional agent?',
    a: 'You get the same access to listings and legal support, with lower fees and a modern digital process for showings and offers.',
  },
  {
    q: 'Is the savings calculator accurate?',
    a: 'Savings are based on typical traditional agent commissions (5–6% total). Your situation may vary; consult your advisor.',
  },
];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function PricingPage() {
  const [homePrice, setHomePrice] = useState(500_000);

  const { traditionalFee, homebaseFee, savings } = useMemo(() => {
    const t = homePrice * 0.06;
    const h = homePrice * 0.02;
    return {
      traditionalFee: t,
      homebaseFee: h,
      savings: t - h,
    };
  }, [homePrice]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
            Simple, transparent fees
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-300">
            Save thousands vs. traditional agent commissions. No surprises at closing.
          </p>
        </div>

        {/* Savings calculator */}
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-50">
            Savings calculator
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Enter a home price to see how much you save with HomeBase.
          </p>
          <div className="mt-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Home price
            </label>
            <input
              type="range"
              min={100_000}
              max={2_000_000}
              step={25_000}
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="mt-2 flex justify-between text-sm text-slate-500">
              <span>{formatCurrency(100_000)}</span>
              <span className="font-semibold text-slate-200">{formatCurrency(homePrice)}</span>
              <span>{formatCurrency(2_000_000)}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Traditional (6%)
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-300">
                {formatCurrency(traditionalFee)}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                HomeBase (2%)
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-300">
                {formatCurrency(homebaseFee)}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                You save
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-200">
                {formatCurrency(savings)}
              </div>
            </div>
          </div>
        </section>

        {/* Fee cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Buyers</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-400">1%</p>
            <p className="mt-1 text-sm text-slate-400">buyer fee at closing</p>
            <p className="mt-4 text-xs text-slate-300">
              No upfront costs. Full access to listings, showings, offers, and transaction tracking.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Sellers</h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">1%</p>
            <p className="mt-1 text-sm text-slate-400">seller fee at closing</p>
            <p className="mt-4 text-xs text-slate-300">
              List your home, get verified buyers, and track offers digitally.
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <section className="mt-12 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/30">
          <h2 className="border-b border-slate-800 px-6 py-4 text-sm font-semibold text-slate-50">
            HomeBase vs. Traditional Agent
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 font-medium text-slate-400">Feature</th>
                  <th className="px-6 py-3 font-medium text-emerald-400">HomeBase</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Traditional</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800/80">
                    <td className="px-6 py-3 text-slate-200">{row.feature}</td>
                    <td className="px-6 py-3">
                      {row.homebase === true ? (
                        <span className="text-emerald-400">✓</span>
                      ) : typeof row.homebase === 'string' ? (
                        <span className="font-medium text-slate-50">{row.homebase}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {row.traditional === true ? (
                        <span className="text-slate-400">✓</span>
                      ) : typeof row.traditional === 'string' ? (
                        row.traditional
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-50">Frequently asked questions</h2>
          <ul className="mt-4 space-y-4">
            {FAQ.map((item) => (
              <li
                key={item.q}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4"
              >
                <h3 className="font-medium text-slate-100">{item.q}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.a}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 text-center">
          <Link
            href="/properties"
            className="inline-flex rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Browse homes
          </Link>
        </div>
      </main>
    </div>
  );
}
