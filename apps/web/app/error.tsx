'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF8] px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
            <svg
              className="h-8 w-8 text-rose-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B4332]">
          HomeBase
        </p>
        <h1 className="mt-4 text-2xl font-bold text-[#1A1A1A]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[#4A4A4A]">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-2xl bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-[#E8E6E1] bg-white px-5 py-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#1B4332]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
