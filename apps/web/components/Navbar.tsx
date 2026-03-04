'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type NavNotification = { id: string; title: string | null; body: string | null; read: boolean; link: string | null; created_at: string | null };

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [navSearch, setNavSearch] = useState('');
  const [notifications, setNotifications] = useState<NavNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      setNotifications([]);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, read, link, created_at')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications((data ?? []) as NavNotification[]);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-50"
                  aria-label="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                {notifications.some((n) => !n.read) && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950" aria-hidden />
                )}
              </div>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,90vw)] rounded-xl border border-slate-800 bg-slate-950 py-2 shadow-xl">
                    <div className="flex items-center justify-between px-4 pb-2">
                      <span className="text-xs font-semibold text-slate-300">Notifications</span>
                      {notifications.some((n) => !n.read) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const { data: { user: u } } = await supabase.auth.getUser();
                            if (u) {
                              await supabase.from('notifications').update({ read: true }).eq('user_id', u.id).eq('read', false);
                              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                            }
                          }}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-500">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left hover:bg-slate-800/80"
                            onClick={async () => {
                              if (!n.read) {
                                await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                              }
                              setNotifOpen(false);
                              if (n.link) router.push(n.link);
                            }}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-100">{n.title ?? 'Update'}</span>
                              {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
                            </div>
                            <p className="line-clamp-2 text-[11px] text-slate-400">{n.body}</p>
                            <span className="text-[10px] text-slate-500">
                              {n.created_at ? (() => {
                                const d = new Date(n.created_at);
                                const s = Math.round((Date.now() - d.getTime()) / 1000);
                                if (s < 60) return 'Just now';
                                if (s < 3600) return `${Math.floor(s / 60)}m ago`;
                                if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
                                return `${Math.floor(s / 86400)}d ago`;
                              })() : ''}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <Link
                      href="/notifications"
                      className="block border-t border-slate-800 px-4 py-2 text-center text-xs font-medium text-emerald-400 hover:bg-slate-800/80"
                      onClick={() => setNotifOpen(false)}
                    >
                      View all
                    </Link>
                  </div>
                </>
              )}
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
                    <Link href="/dashboard" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50" onClick={() => setUserOpen(false)}>
                      Dashboard
                    </Link>
                    <Link href="/offers" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50" onClick={() => setUserOpen(false)}>
                      My offers
                    </Link>
                    <Link href="/saved" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50" onClick={() => setUserOpen(false)}>
                      Saved homes
                    </Link>
                    <Link href="/sell" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50" onClick={() => setUserOpen(false)}>
                      Sell a home
                    </Link>
                    <Link href="/profile" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50" onClick={() => setUserOpen(false)}>
                      Profile
                    </Link>
                    <button type="button" onClick={handleSignOut} className="w-full px-4 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50">
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
                <Link href="/notifications" className="rounded-lg px-3 py-2 hover:bg-slate-800 hover:text-slate-50" onClick={() => setOpen(false)}>
                  Notifications
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
