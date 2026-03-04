// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();
import { PropertyCard } from '@/components/PropertyCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/ToastProvider';

type Property = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  imageUrl: string | null;
  propertyType: string | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const GUEST_SAVED_KEY = 'homebase_saved';

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialQ = searchParams.get('q') ?? '';
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [totalCount, setTotalCount] = useState(0);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2_000_000);
  const [beds, setBeds] = useState<number | null>(null);
  const [baths, setBaths] = useState<number | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set());
  const PAGE_SIZE = 12;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setSearchQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const loadSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const guestSaved: (string | number)[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(GUEST_SAVED_KEY);
          if (raw) guestSaved.push(...JSON.parse(raw));
        } catch {}
      }
      if (!user) {
        setSavedIds(new Set(guestSaved));
        return;
      }
      const { data } = await supabase.from('saved_properties').select('propertyId');
      const serverIds = new Set((data ?? []).map((r: { propertyId: string | number }) => r.propertyId));
      guestSaved.forEach((id) => serverIds.add(id));
      setSavedIds(serverIds);
    };
    loadSaved();
  }, []);

  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  const buildQuery = useMemo(() => {
    return () => {
      const select = 'id, title, address, city, state, price, bedrooms, bathrooms, sqft, imageUrl, propertyType';
      let q = supabase
        .from('properties')
        .select(select, { count: 'exact' })
        .eq('status', 'ACTIVE')
        .order('createdAt', { ascending: false });
      const searchTerm = debouncedSearch.replace(/%/g, '\\%');
      if (searchTerm.length > 0) {
        q = q.or(
          `address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,zipCode.ilike.%${searchTerm}%`
        );
      }
      q = q.gte('price', minPrice).lte('price', maxPrice);
      if (beds != null) q = q.gte('bedrooms', beds);
      if (baths != null) q = q.gte('bathrooms', baths);
      if (types.length > 0) q = q.in('propertyType', types);
      return q;
    };
  }, [debouncedSearch, minPrice, maxPrice, beds, baths, types]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const query = buildQuery().range(0, PAGE_SIZE - 1);
      const { data, error: fetchError, count } = await query;
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setProperties([]);
        setTotalCount(0);
      } else {
        setProperties((data ?? []) as Property[]);
        setTotalCount(count ?? 0);
      }
      setHasMore((data ?? []).length === PAGE_SIZE);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [buildQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const from = properties.length;
    const to = from + PAGE_SIZE - 1;
    const query = buildQuery().range(from, to);
    const { data } = await query;
    const list = (data ?? []) as Property[];
    setProperties((prev) => [...prev, ...list]);
    setHasMore(list.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const filtered = properties;
  const isLoadingResults = loading;

  const handleToggleType = (value: string) => {
    setTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const handleSaveClick = async (e: React.MouseEvent, propertyId: string | number) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const isSaved = savedIds.has(propertyId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
    if (!user) {
      try {
        const next = new Set(savedIds);
        if (isSaved) next.delete(propertyId);
        else next.add(propertyId);
        localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      toast(isSaved ? 'Removed from saved homes' : 'Saved to favorites');
      return;
    }
    if (isSaved) {
      await supabase.from('saved_properties').delete().eq('propertyId', propertyId).eq('userId', user.id);
      toast('Removed from saved homes');
    } else {
      await supabase.from('saved_properties').insert({ userId: user.id, propertyId: propertyId });
      toast('Saved to favorites');
    }
  };

  const priceLabel = `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Homes on the market
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Explore homes across top U.S. markets.
          </p>
          <div className="mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="City, address, or ZIP"
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 md:flex-row">
          <aside className="w-full rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-xs text-slate-200 md:w-72">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Filters
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Price range
                  </span>
                  <span className="text-[11px] text-slate-300">
                    ${priceLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={2_000_000}
                    step={50_000}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer accent-emerald-500"
                  />
                  <input
                    type="range"
                    min={0}
                    max={2_000_000}
                    step={50_000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Beds
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setBeds((prev) => (prev === value ? null : value))
                      }
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        beds === value
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-200'
                      }`}
                    >
                      {value}+
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Baths
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setBaths((prev) => (prev === value ? null : value))
                      }
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        baths === value
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-200'
                      }`}
                    >
                      {value}+
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Property type
                </span>
                <div className="space-y-1">
                  {['house', 'condo', 'townhome', 'multi_family'].map(
                    (value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 text-[11px]"
                      >
                        <input
                          type="checkbox"
                          checked={types.includes(value)}
                          onChange={() => handleToggleType(value)}
                          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500"
                        />
                        <span className="capitalize text-slate-200">
                          {value.replace('_', ' ')}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 rounded-2xl border border-slate-900 bg-slate-950/60 p-3 sm:p-4">
            {error && (
              <div className="mb-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[11px] text-rose-100">
                {error}
              </div>
            )}

            {loading ? (
              <LoadingSkeleton variant="propertyList" />
            ) : filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-slate-400">
                <div className="mb-3 text-4xl">🔍</div>
                <p className="text-sm">No homes match your search or filters.</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-slate-400">
                  {totalCount} {totalCount === 1 ? 'home' : 'homes'} found
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <PropertyCard
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    address={p.address}
                    city={p.city}
                    state={p.state}
                    price={p.price}
                    beds={p.bedrooms}
                    baths={p.bathrooms}
                    sqft={p.sqft}
                    imageUrl={p.imageUrl}
                    href={`/properties/${p.id}`}
                    showSave
                    saved={savedIds.has(p.id)}
                    onSaveClick={(e) => handleSaveClick(e, p.id)}
                  />
                ))}
                </div>
              </>
            )}
            {hasMore && filtered.length >= PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-emerald-500/60 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
