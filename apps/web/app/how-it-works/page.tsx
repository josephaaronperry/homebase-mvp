import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works | HomeBase',
  description: 'The 5-step HomeBase process from search to closing.',
};

const STEPS = [
  { icon: '🔍', title: 'Search & save', desc: 'Browse listings and save favorites.' },
  { icon: '📅', title: 'Schedule tours', desc: 'Book in-person or virtual showings.' },
  { icon: '✓', title: 'Get verified', desc: 'Complete identity verification to make offers.' },
  { icon: '📝', title: 'Make offers', desc: 'Submit offers digitally and track status.' },
  { icon: '🏠', title: 'Close', desc: 'Follow your timeline to closing day.' },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link href="/" className="text-xs font-medium text-slate-400 hover:text-emerald-400">← Home</Link>
        <h1 className="mt-8 text-3xl font-bold text-slate-50">How HomeBase works</h1>
        <p className="mt-2 text-slate-300">Five steps from search to keys.</p>
        <div className="mt-12 space-y-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xl">{s.icon}</div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Step {i + 1}</span>
                <h2 className="mt-1 text-xl font-semibold text-slate-50">{s.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link href="/register" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Get started</Link>
        </div>
      </main>
    </div>
  );
}
