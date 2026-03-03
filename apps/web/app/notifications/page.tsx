'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Notification = {
  id: string | number;
  title: string | null;
  body: string | null;
  created_at: string | null;
  read: boolean | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setItems((data ?? []) as Notification[]);
      setLoading(false);
    };

    load();
  }, [router]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                {unreadCount} unread
              </span>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/40">
          <div className="mb-4 flex items-center justify-between text-xs">
            <p className="font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Activity feed
            </p>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="mb-3 text-4xl">🔔</div>
              <p>No notifications yet. We&apos;ll keep you posted on offers,
              showings, and status updates.</p>
            </div>
          ) : (
            <ul className="space-y-3 text-xs text-slate-200">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                >
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-semibold text-slate-100">
                        {n.title ?? 'Update'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString()
                          : ''}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      {n.body}
                    </p>
                    {!n.read && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        Unread
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

