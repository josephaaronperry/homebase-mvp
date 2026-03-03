import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | HomeBase',
  description: 'HomeBase fee structure: 1% buyer fee, 1% seller fee vs traditional 6%.',
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">← Home</Link>
        <h1 className="mt-8 text-3xl font-bold text-slate-50">Pricing</h1>
        <p className="mt-2 text-slate-300">Simple, transparent fees. Save thousands vs traditional agents.</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Buyers</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-400">1%</p>
            <p className="mt-1 text-sm text-slate-400">buyer fee at closing</p>
            <p className="mt-4 text-xs text-slate-300">No upfront costs. Full access to listings, showings, offers, and transaction tracking.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Sellers</h2>
            <p className="mt-2 text-3xl font-bold text-slate-100">1%</p>
            <p className="mt-1 text-sm text-slate-400">seller fee at closing</p>
            <p className="mt-4 text-xs text-slate-300">List your home, get verified buyers, and track offers digitally.</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Traditional comparison</h3>
          <p className="mt-2 text-sm text-slate-300">Typical agent commissions: 5–6% from the seller (often passed to the buyer in the price). HomeBase: 1% + 1% = 2% total. On a $500k home, that’s up to $20k in savings.</p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/properties" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Browse homes</Link>
        </div>
      </main>
    </div>
  );
}
