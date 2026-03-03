'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [navSearch, setNavSearch] = useState('');

  useEffect(() => {
    const get = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
    };
    get();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => get());
    return () => subscription.unsubscribe();
  }, []);

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/properties?q=${encodeURIComponent(navSearch.trim())}`);
      setOpen(false);
    } else {
      router.push('/properties');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserOpen(false);
    setOpen(false);
    router.push('/');
  };

  const navLinks = (
    <>
      <Link href="/properties" className="text-slate-300 hover:text-slate-50" onClick={() => setOpen(false)}>
        Browse
      </Link>
      <Link href="/how-it-works" className="text-slate-300 hover:text-slate-50" onClick={() => setOpen(false)}>
        How it works
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setSellOpen((v) => !v)}
          className="flex items-center gap-0.5 text-slate-300 hover:text-slate-50"
        >
          Sell
          <span className="text-[10px]">▼</span>
        </button>
        {sellOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSellOpen(false)} aria-hidden />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-800 bg-slate-950 py-2 shadow-xl">
              <Link
                href="/sell/list"
                className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                onClick={() => { setSellOpen(false); setOpen(false); }}
              >
                List your home
              </Link>
              <Link
                href="/sell/dashboard"
                className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                onClick={() => { setSellOpen(false); setOpen(false); }}
              >
                Seller dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <header className="sticky inset-x-0 top-0 z-30 border-b border-slate-900 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
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

        {/* Center: search (desktop) */}
        <form
          onSubmit={handleNavSearch}
          className="hidden flex-1 max-w-md mx-4 md:block"
        >
          <div className="flex gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs shadow-sm">
            <span className="flex items-center text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="City, neighborhood, address or ZIP"
              className="h-6 flex-1 bg-transparent text-slate-50 outline-none placeholder:text-slate-500"
            />
          </div>
        </form>

        {/* Right: nav links + auth (desktop) */}
        <nav className="hidden items-center gap-5 text-xs font-medium md:flex">
          {navLinks}
          {user ? (
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-50"
                aria-label="Notifications"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300"
              >
                {(user.user_metadata?.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-800 bg-slate-950 py-2 shadow-xl">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                      onClick={() => setUserOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                      onClick={() => setUserOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href={pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login'}
                className="text-slate-300 hover:text-slate-50"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-200 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? (
            <span className="text-lg leading-none">✕</span>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-900 bg-slate-950/98 px-4 pb-4 pt-3 md:hidden">
          <form onSubmit={handleNavSearch} className="mb-3">
            <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
              <input
                type="search"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search city or address"
                className="flex-1 bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-500"
              />
              <button type="submit" className="text-emerald-400 text-xs font-semibold">Go</button>
            </div>
          </form>
          <nav className="flex flex-col gap-1 text-sm text-slate-200">
            <Link href="/properties" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              Browse homes
            </Link>
            <Link href="/how-it-works" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              How it works
            </Link>
            <Link href="/sell" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              Sell
            </Link>
            <Link href="/sell/list" className="rounded-lg px-3 py-2 pl-6 text-slate-400 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              List your home
            </Link>
            <Link href="/sell/dashboard" className="rounded-lg px-3 py-2 pl-6 text-slate-400 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              Seller dashboard
            </Link>
            <Link href="/saved" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
              Saved homes
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <button type="button" onClick={handleSignOut} className="rounded-lg px-3 py-2 text-left text-slate-400 hover:bg-slate-800 hover:text-slate-50">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href={pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login'} className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
