import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Five steps from search to keys: search and save, schedule tours, get verified, make offers, and close with HomeBase.',
  openGraph: { title: 'How HomeBase works', description: 'Five steps from search to keys.' },
};

const STEPS = [
  { num: '01', icon: '🔍', title: 'Search & save', desc: 'Browse live listings across top U.S. markets. Save favorites and get alerts.', cta: 'Browse homes', href: '/properties' },
  { num: '02', icon: '📅', title: 'Schedule tours', desc: 'Book in-person or virtual showings in one click. No back-and-forth calls.', cta: 'See a home', href: '/properties' },
  { num: '03', icon: '✓', title: 'Get verified', desc: 'Complete a quick identity check. Verified buyers can submit offers.', cta: 'Get verified', href: '/verify' },
  { num: '04', icon: '📝', title: 'Make offers', desc: 'Submit offers digitally. Track status in real time.', cta: 'Make an offer', href: '/properties' },
  { num: '05', icon: '🏠', title: 'Close', desc: 'Follow your transaction timeline to closing day.', cta: 'Track transaction', href: '/dashboard' },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">The HomeBase way</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">How HomeBase works</h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-300">Five steps from search to keys. No hidden fees, no endless paperwork.</p>
        </div>
        <div className="relative mt-16">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 to-transparent hidden sm:block" aria-hidden />
          <ul className="space-y-12 sm:space-y-16">
            {STEPS.map((step) => (
              <li key={step.num} className="relative flex flex-col sm:flex-row sm:gap-10">
                <div className="flex shrink-0 items-start gap-4 sm:flex-col sm:items-center sm:w-24">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 text-2xl">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-bold tabular-nums text-slate-600 sm:text-4xl">{step.num}</span>
                </div>
                <div className="min-w-0 flex-1 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">{step.title}</h2>
                  <p className="mt-3 text-slate-300 leading-relaxed">{step.desc}</p>
                  <Link href={step.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                    {step.cta} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <section className="mt-20 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900/80 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">Ready to find your home?</h2>
          <p className="mt-3 text-slate-300 max-w-lg mx-auto">Join thousands who use HomeBase to search, tour, and close.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-flex rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Get started free</Link>
            <Link href="/properties" className="inline-flex rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-emerald-500/50">Browse homes</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
