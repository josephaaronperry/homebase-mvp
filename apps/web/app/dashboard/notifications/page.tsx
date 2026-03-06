'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type NotificationRow = {
  id: string;
  title: string | null;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string | null;
};

function formatTime(created_at: string | null): string {
  if (!created_at) return '';
  const d = new Date(created_at);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const [list, setList] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setError(null);
      const { data, error: err } = await supabase
        .from('notifications')
        .select('id, title, body, link, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setList((data ?? []) as NotificationRow[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMarking(true);
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarking(false);
  };

  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-[#4A4A4A] hover:text-[#1B4332]">← Dashboard</Link>
            <h1 className="mt-2 font-display text-2xl font-semibold text-[#1A1A1A]">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <motion.button
              type="button"
              onClick={markAllRead}
              disabled={marking}
              className="rounded-xl border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-semibold text-[#1B4332] hover:bg-[#D1FAE5] disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {marking ? 'Updating…' : 'Mark all read'}
            </motion.button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1B4332] border-t-transparent" />
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-[#4A4A4A]">No notifications yet.</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-[#1B4332] hover:underline">Back to dashboard</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button
                  type="button"
                  className="w-full rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3 text-left shadow-sm hover:border-[#1B4332]/30"
                  onClick={async () => {
                    if (n.link) router.push(n.link);
                    if (!n.read) {
                      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-[#1A1A1A] ${!n.read ? 'font-semibold' : ''}`}>{n.title ?? 'Update'}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[#4A4A4A]">{n.body}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#1B4332]" />}
                  </div>
                  <p className="mt-2 text-xs text-[#4A4A4A]">{formatTime(n.created_at)}</p>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
