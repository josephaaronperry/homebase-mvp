import Link from 'next/link';

import { SearchBar } from '@/components/SearchBar';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF8] px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#E8E6E1]">
            <span className="text-5xl">🏠</span>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#52B788]">
          HomeBase
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#1A1A1A]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[#4A4A4A]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 max-w-md">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#4A4A4A]">
            Search for a home
          </p>
          <SearchBar placeholder="City, address, or ZIP..." />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-2xl bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#2D5A47]"
          >
            Go home
          </Link>
          <Link
            href="/properties"
            className="rounded-2xl border border-[#E8E6E1] bg-white px-5 py-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#1B4332]"
          >
            Browse homes
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-[#E8E6E1] px-5 py-3 text-sm font-semibold text-[#4A4A4A] hover:border-[#1B4332]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
