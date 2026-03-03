import Link from 'next/link';

import { SearchBar } from '@/components/SearchBar';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-800/80">
            <span className="text-5xl">🏠</span>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          HomeBase
        </p>
        <h1 className="mt-4 text-3xl font-bold text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 max-w-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Search for a home
          </p>
          <SearchBar placeholder="City, address, or ZIP..." />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Go home
          </Link>
          <Link
            href="/properties"
            className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-600"
          >
            Browse homes
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-600"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
