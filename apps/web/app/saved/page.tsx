'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type SavedProperty = {
  id: string | number;
  property_id: string | number;
  price: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  image_url?: string | null;
};

export default function SavedPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedProperty[]>([]);
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
        .from('saved_properties_with_details')
        .select('*')
        .order('created_at', { ascending: false });

      setSaved((data ?? []) as SavedProperty[]);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleRemove = async (propertyId: string | number) => {
    await supabase
      .from('saved_properties')
      .delete()
      .eq('property_id', propertyId);
    setSaved((s) => s.filter((p) => p.property_id !== propertyId));
  };

  const fmt = (p: number | null) =>
    p ? '$' + Number(p).toLocaleString() : '—';

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-950 text-slate-50">
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60"
        >
          ← Dashboard
        </Link>
        <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Saved homes
        </h1>
      </header>

      <main className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl shadow-black/40">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
              />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="mb-3 text-4xl">❤️</div>
            <p>No saved homes yet. Start browsing and tap the heart icon.</p>
            <div className="mt-6">
              <Link
                href="/properties"
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Browse listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <div
                key={s.id}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-3"
              >
                <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-slate-800">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image_url}
                      alt={s.address ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🏠
                    </div>
                  )}
                </div>
                <div className="flex-1 text-xs text-slate-300">
                  <div className="text-sm font-semibold text-slate-50">
                    {fmt(s.price)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-200">
                    {s.address}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {s.city}, {s.state} • {s.bedrooms ?? '-'} bd • {s.bathrooms ?? '-'}{' '}
                    ba
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <button
                    onClick={() => handleRemove(s.property_id)}
                    className="rounded-full border border-rose-500/60 px-3 py-1 text-rose-200 hover:bg-rose-500/10"
                  >
                    Remove
                  </button>
                  <Link
                    href={`/properties/${s.property_id}`}
                    className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Schedule tour
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

