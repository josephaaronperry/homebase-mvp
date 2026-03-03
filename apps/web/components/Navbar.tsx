'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky inset-x-0 top-0 z-30 border-b border-slate-900 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
            <span className="text-lg">🏠</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-50">HomeBase</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Real estate platform
            </div>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-between gap-6 pl-6 md:flex">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 shadow-sm shadow-black/40">
              <span className="text-slate-500">Search</span>
              <input
                className="h-5 flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                placeholder="City, neighborhood, address or ZIP"
              />
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <Link href="/properties" className="hover:text-slate-50">
              Browse
            </Link>
            <Link href="/login" className="hover:text-slate-50">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
            >
              Get the app
            </Link>
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 p-2 text-slate-200 md:hidden"
          aria-label="Toggle navigation"
        >
          <span className="h-0.5 w-4 bg-slate-200" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-900 bg-slate-950/98 px-4 pb-4 pt-2 text-xs text-slate-200 md:hidden">
          <div className="mb-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5">
              <span className="text-slate-500">Search</span>
              <input
                className="h-5 flex-1 bg-transparent text-xs text-slate-50 outline-none placeholder:text-slate-500"
                placeholder="City, neighborhood, address or ZIP"
              />
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/properties" className="hover:text-slate-50">
              Browse homes
            </Link>
            <Link href="/login" className="hover:text-slate-50">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-slate-50">
              Get started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

