import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900 bg-black/90 text-xs text-slate-400">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-lg">🏠</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-50">
                HomeBase
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Real estate platform
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            A Zillow-level experience for search, showings, and offers, built on
            a modern Supabase + Next.js stack.
          </p>
        </div>

        <div className="flex flex-1 flex-wrap gap-8">
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              Platform
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="/properties" className="hover:text-slate-200">
                  Browse homes
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-slate-200">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-slate-200">
                  Saved homes
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              Company
            </h3>
            <ul className="space-y-1">
              <li>
                <Link href="#" className="hover:text-slate-200">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-slate-200">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-slate-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              Connect
            </h3>
            <div className="flex gap-3 text-sm">
              <Link href="#" className="hover:text-slate-200">
                X
              </Link>
              <Link href="#" className="hover:text-slate-200">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-slate-200">
                Instagram
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              Get the app
            </h3>
            <div className="space-y-2">
              <div className="flex h-9 w-32 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-semibold text-slate-200">
                App Store
              </div>
              <div className="flex h-9 w-32 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-semibold text-slate-200">
                Google Play
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} HomeBase. All rights reserved.</span>
          <div className="flex gap-3">
            <Link href="#" className="hover:text-slate-200">
              Privacy
            </Link>
            <Link href="#" className="hover:text-slate-200">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

