import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sell your home | HomeBase',
  description:
    'List your home on HomeBase. Get verified buyers only, track offers digitally, and close faster.',
};

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">
          ← HomeBase
        </Link>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Sell with HomeBase
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            List your home. Get verified buyers only.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            HomeBase connects you with serious, identity-verified buyers. Track every offer digitally, respond faster, and close with confidence.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="text-2xl">📋</div>
            <h2 className="mt-3 text-lg font-semibold text-slate-50">List your home</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add your property in minutes. Upload photos, set your price, and go live.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="text-2xl">✓</div>
            <h2 className="mt-3 text-lg font-semibold text-slate-50">Verified buyers only</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every offer comes from a buyer who has completed identity verification. No tire-kickers.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="text-2xl">⚡</div>
            <h2 className="mt-3 text-lg font-semibold text-slate-50">Close faster</h2>
            <p className="mt-2 text-sm text-slate-400">
              Track offers, showings, and documents in one place. Digital process from list to closing.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-50">Ready to list?</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create your listing in a few steps. No commitment until you publish.
          </p>
          <Link
            href="/sell/list"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:bg-emerald-400"
          >
            Start listing
          </Link>
        </div>
      </main>
    </div>
  );
}
