import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Six steps from browse to close: browse listings, submit an offer, seller accepts, lenders compete, you choose your lender, and we guide you to closing.',
  openGraph: { title: 'How HomeBase works', description: 'Six steps from browse to close. No agents needed.' },
};

const STEPS = [
  { num: '01', icon: '🔍', title: 'Browse listings', desc: 'Explore verified homes with full data. No agent needed to see listings or schedule tours.', cta: 'Browse homes', href: '/properties' },
  { num: '02', icon: '📝', title: 'Submit an offer directly', desc: 'Make an offer straight to the seller. No middleman — you submit your price, terms, and message directly.', cta: 'Browse homes', href: '/properties' },
  { num: '03', icon: '✓', title: 'Seller accepts', desc: 'When the seller accepts your offer, you get notified instantly. No waiting on callbacks.', cta: 'Get verified', href: '/verify' },
  { num: '04', icon: '🏦', title: 'Lenders compete for your business', desc: 'We send your deal to our network of lenders who submit their best rates. You get real competition.', cta: 'Dashboard', href: '/dashboard' },
  { num: '05', icon: '📋', title: 'You choose your lender', desc: 'Compare rates and pick the best deal. No pressure — you’re in control of your financing.', cta: 'Dashboard', href: '/dashboard' },
  { num: '06', icon: '🏠', title: 'Close', desc: 'We guide you through every remaining step to closing. One clear timeline, no surprises.', cta: 'Track transaction', href: '/dashboard' },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">The HomeBase way</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">How HomeBase works</h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-300">Six steps from browse to close. No agents, no hidden fees.</p>
        </div>

        <div className="mt-10 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-center sm:px-8 sm:py-6">
          <p className="text-lg font-semibold text-slate-50 sm:text-xl">
            The average HomeBase buyer saves $15,000–$25,000 in agent commissions.
          </p>
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
          <h2 className="text-2xl font-bold text-slate-50 sm:text-3xl">Ready to get started?</h2>
          <p className="mt-3 text-slate-300 max-w-lg mx-auto">Browse homes or list your own. No agents required.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/properties" className="inline-flex rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Browse homes</Link>
            <Link href="/sell" className="inline-flex rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-emerald-500/50">List your home</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
