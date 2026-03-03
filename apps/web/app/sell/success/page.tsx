import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Listing submitted',
  description: 'Your listing is under review. We’ll be in touch soon.',
};

export default function SellSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl text-emerald-400">
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-50">Your listing is under review</h1>
        <p className="mt-3 text-slate-300">
          We’ll review your listing and get back to you within 1–2 business days. You’ll receive an email once it’s live.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">Next steps</p>
          <ul className="space-y-2 text-left text-sm text-slate-300">
            <li>• Check your email for confirmation and any follow-up questions.</li>
            <li>• Add or update photos from your seller dashboard if needed.</li>
            <li>• When approved, your listing will go live and you can start receiving showings and offers.</li>
          </ul>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sell/dashboard"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Go to seller dashboard
          </Link>
          <Link
            href="/properties"
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-emerald-500/50"
          >
            Browse homes
          </Link>
        </div>
      </main>
    </div>
  );
}
