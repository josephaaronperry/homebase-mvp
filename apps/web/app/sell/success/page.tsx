'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

export default function SellSuccessPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!propertyId);

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      const { data } = await supabase.from('properties').select('address, city, state').eq('id', propertyId).maybeSingle();
      if (data) {
        const parts = [(data as { address: string | null }).address, (data as { city: string | null }).city, (data as { state: string | null }).state].filter(Boolean);
        setAddress(parts.join(', '));
      }
      setLoading(false);
    };
    load();
  }, [propertyId]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl text-emerald-400">
          ✓
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-50">Your listing is under review</h1>
        {loading && <p className="mt-3 text-slate-400">Loading...</p>}
        {address && !loading && <p className="mt-3 font-medium text-emerald-300">{address}</p>}
        <p className="mt-3 text-slate-300">
          We’ll review your listing and get back to you within 1–2 business days. You’ll receive an email once it’s live.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/sell/dashboard" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
            Go to seller dashboard
          </Link>
          <Link href="/properties" className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-emerald-500/50">
            Browse homes
          </Link>
        </div>
      </main>
    </div>
  );
}
