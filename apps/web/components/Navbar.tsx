'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type NavNotification = { id: string; title: string | null; body: string | null; read: boolean; link: string | null; created_at: string | null };

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      <Link href="/properties" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body text-sm font-medium" onClick={() => setOpen(false)}>
        Browse
      </Link>
      <Link href="/pre-approval" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body text-sm font-medium" onClick={() => setOpen(false)}>
        Get pre-approved
      </Link>
      <Link href="/how-it-works" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body text-sm font-medium" onClick={() => setOpen(false)}>
        How it works
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setSellOpen((v) => !v)}
          className="flex items-center gap-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body text-sm font-medium"
        >
          For sellers
          <span className="text-[10px]">▼</span>
        </button>
        {sellOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSellOpen(false)} aria-hidden />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-warm-border bg-[var(--color-bg-card)] py-2 shadow-[var(--shadow-modal)]">
              <Link
                href="/sell"
                className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle"
                onClick={() => { setSellOpen(false); setOpen(false); }}
              >
                Sell your home
              </Link>
              <Link
                href="/sell/dashboard"
                className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle"
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
    <header
      className={`sticky inset-x-0 top-0 z-30 border-b bg-[var(--color-bg-card)] transition-shadow ${
        scrolled ? 'shadow-[var(--shadow-card)]' : 'border-[var(--color-border)]'
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-brand-primary)]">
            <HouseIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-[var(--color-brand-primary)]">
            HomeBase
          </span>
        </Link>

        {/* Center: search (desktop) */}
        <form onSubmit={handleNavSearch} className="hidden flex-1 max-w-md mx-4 md:block">
          <div className="flex gap-2 rounded-full border border-[var(--color-border-strong)] bg-warm-subtle px-3 py-1.5 text-sm">
            <span className="flex items-center text-[var(--color-text-muted)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="City, neighborhood, address or ZIP"
              className="h-6 flex-1 bg-transparent text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </form>

        {/* Right: nav links + auth (desktop) */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks}
          {user ? (
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-warm-subtle hover:text-[var(--color-text-primary)]"
                  aria-label="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                {notifications.some((n) => !n.read) && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[var(--color-error)] ring-2 ring-white" aria-hidden />
                )}
              </div>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,90vw)] rounded-xl border border-warm-border bg-[var(--color-bg-card)] py-2 shadow-[var(--shadow-modal)]">
                    <div className="flex items-center justify-between px-4 pb-2">
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">Notifications</span>
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
                          className="text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-light)]"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left hover:bg-warm-subtle"
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
                              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{n.title ?? 'Update'}</span>
                              {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-accent)]" />}
                            </div>
                            <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{n.body}</p>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
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
                      className="block border-t border-warm-border px-4 py-2 text-center text-sm font-medium text-[var(--color-brand-primary)] hover:bg-warm-subtle"
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary-subtle)] text-sm font-semibold text-[var(--color-brand-primary)]"
              >
                {(user.user_metadata?.full_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-warm-border bg-[var(--color-bg-card)] py-2 shadow-[var(--shadow-modal)]">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      Dashboard
                    </Link>
                    <Link href="/pre-approval" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      Pre-approval status
                    </Link>
                    <Link href="/offers" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      My offers
                    </Link>
                    <Link href="/saved" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      Saved homes
                    </Link>
                    <Link href="/sell" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      Sell your home
                    </Link>
                    <Link href="/profile" className="block px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle" onClick={() => setUserOpen(false)}>
                      Profile
                    </Link>
                    <button type="button" onClick={handleSignOut} className="w-full px-4 py-2 text-left text-sm font-medium text-[var(--color-text-primary)] hover:bg-warm-subtle">
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
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-body text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-warm-subtle text-[var(--color-text-primary)] md:hidden"
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
        <div className="border-t border-warm-border bg-[var(--color-bg-card)] px-4 pb-4 pt-3 md:hidden">
          <form onSubmit={handleNavSearch} className="mb-3">
            <div className="flex gap-2 rounded-xl border border-warm-border bg-warm-subtle px-3 py-2">
              <input
                type="search"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search city or address"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
              <button type="submit" className="text-xs font-semibold text-[var(--color-brand-primary)]">Go</button>
            </div>
          </form>
          <nav className="flex flex-col gap-1 text-sm text-[var(--color-text-primary)]">
            <Link href="/properties" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              Browse
            </Link>
            <Link href="/pre-approval" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              Get pre-approved
            </Link>
            <Link href="/how-it-works" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              How it works
            </Link>
            <Link href="/sell" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              For sellers
            </Link>
            <Link href="/sell" className="rounded-lg px-3 py-2 pl-6 text-[var(--color-text-muted)] hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              Sell your home
            </Link>
            <Link href="/sell/dashboard" className="rounded-lg px-3 py-2 pl-6 text-[var(--color-text-muted)] hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              Seller dashboard
            </Link>
            <Link href="/saved" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
              Saved homes
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/notifications" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
                  Notifications
                </Link>
                <button type="button" onClick={handleSignOut} className="rounded-lg px-3 py-2 text-left text-[var(--color-text-muted)] hover:bg-warm-subtle">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href={pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login'} className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="rounded-lg px-3 py-2 hover:bg-warm-subtle" onClick={() => setOpen(false)}>
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
