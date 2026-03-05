'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';
import { PropertyCard } from '@/components/PropertyCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/ToastProvider';

const supabase = getSupabaseClient();

const PRICE_MIN = 100_000;
const PRICE_MAX = 10_000_000;
const PROPERTY_TYPES = [
  { value: 'house', label: 'House', dbValues: ['house', 'SINGLE_FAMILY', 'single_family'] },
  { value: 'condo', label: 'Condo', dbValues: ['condo', 'CONDO'] },
  { value: 'townhome', label: 'Townhome', dbValues: ['townhome', 'TOWNHOUSE', 'townhouse'] },
  { value: 'multi_family', label: 'Multi-family', dbValues: ['multi_family', 'MULTI_FAMILY', 'multi-family'] },
  { value: 'land', label: 'Land', dbValues: ['land', 'LAND'] },
];

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
  lot_size: number | null;
  image_url: string | null;
  property_type: string | null;
  description: string | null;
  images: string[] | null;
  year_built: number | null;
  garage: boolean | number | null;
  hoa_fee: number | null;
  created_at: string | null;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

const GUEST_SAVED_KEY = 'homebase_saved';

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialQ = searchParams.get('q') ?? '';
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [savedIds, setSavedIds] = useState<Set<string | number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filters — Zillow-level
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [beds, setBeds] = useState<number | null>(null); // null = Any, 1-5 = 1+, 2+, etc.
  const [baths, setBaths] = useState<number | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [minSqft, setMinSqft] = useState<number | null>(null);
  const [maxSqft, setMaxSqft] = useState<number | null>(null);
  const [yearBuiltMin, setYearBuiltMin] = useState<number | null>(null);
  const [parking, setParking] = useState<'any' | '1+' | '2+'>('any');
  const [hoa, setHoa] = useState<'any' | 'no' | 'yes'>('any');
  const [keywords, setKeywords] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'beds_desc' | 'sqft_desc'>('newest');

  useEffect(() => setSearchQuery(initialQ), [initialQ]);

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

  // Single initial load: fetch all ACTIVE properties (with optional search). Use image_url and snake_case columns.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const select = 'id, title, address, city, state, price, bedrooms, bathrooms, sqft, lot_size, image_url, property_type, description, images, year_built, garage, hoa_fee, created_at';
      let q = supabase
        .from('properties')
        .select(select)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (debouncedSearch.length > 0) {
        const term = debouncedSearch.replace(/%/g, '\\%');
        q = q.or(
          `address.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,description.ilike.%${term}%,title.ilike.%${term}%`
        );
      }

      const { data, error: fetchError } = await q;
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setAllProperties([]);
      } else {
        setAllProperties((data ?? []) as Property[]);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const resetFilters = () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setBeds(null);
    setBaths(null);
    setTypes([]);
    setMinSqft(null);
    setMaxSqft(null);
    setYearBuiltMin(null);
    setParking('any');
    setHoa('any');
    setKeywords('');
    setSortBy('newest');
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...allProperties];

    const price = (p: Property) => p.price ?? 0;
    const desc = (p: Property) => (p.description ?? '').toLowerCase();
    const pt = (p: Property) => (p.property_type ?? '').toLowerCase().replace(/-/g, '_');
    const garageNum = (p: Property) => {
      const g = p.garage;
      if (g === true) return 1;
      if (typeof g === 'number') return g;
      return 0;
    };

    list = list.filter((p) => {
      if (price(p) < minPrice || price(p) > maxPrice) return false;
      if (beds != null && (p.bedrooms ?? 0) < beds) return false;
      if (baths != null && (p.bathrooms ?? 0) < baths) return false;
      if (types.length > 0) {
        const match = types.some((t) => {
          const opt = PROPERTY_TYPES.find((o) => o.value === t);
          return opt?.dbValues.some((d) => pt(p).includes(d.toLowerCase().replace(/-/g, '_'))) ?? false;
        });
        if (!match) return false;
      }
      if (minSqft != null && minSqft > 0 && (p.sqft ?? 0) < minSqft) return false;
      if (maxSqft != null && maxSqft > 0 && (p.sqft ?? 0) > maxSqft) return false;
      if (yearBuiltMin != null && yearBuiltMin > 0 && (p.year_built ?? 0) < yearBuiltMin) return false;
      if (parking === '1+' && garageNum(p) < 1) return false;
      if (parking === '2+' && garageNum(p) < 2) return false;
      if (hoa === 'no' && (p.hoa_fee ?? 0) > 0) return false;
      if (hoa === 'yes' && (p.hoa_fee ?? 0) <= 0) return false;
      if (keywords.trim()) {
        const words = keywords.trim().toLowerCase().split(/\s+/);
        const text = desc(p);
        if (!words.every((w) => text.includes(w))) return false;
      }
      return true;
    });

    const createdAt = (p: Property) => (p.created_at ? new Date(p.created_at).getTime() : 0);
    if (sortBy === 'price_asc') list.sort((a, b) => price(a) - price(b));
    else if (sortBy === 'price_desc') list.sort((a, b) => price(b) - price(a));
    else if (sortBy === 'beds_desc') list.sort((a, b) => (b.bedrooms ?? 0) - (a.bedrooms ?? 0));
    else if (sortBy === 'sqft_desc') list.sort((a, b) => (b.sqft ?? 0) - (a.sqft ?? 0));
    else list.sort((a, b) => createdAt(b) - createdAt(a));

    return list;
  }, [allProperties, minPrice, maxPrice, beds, baths, types, minSqft, maxSqft, yearBuiltMin, parking, hoa, keywords, sortBy]);

  const handleToggleType = (value: string) => {
    setTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
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
      await supabase.from('saved_properties').insert({ userId: user.id, propertyId });
      toast('Saved to favorites');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A] sm:text-2xl">
              Homes on the market
            </h1>
            <p className="mt-1 text-xs text-[#4A4A4A] sm:text-sm">
              Explore homes across top U.S. markets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="City, address, ZIP, or keywords"
              className="w-56 rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#888888] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#52B788]/40 sm:w-64"
            />
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm font-medium text-[#1A1A1A] shadow-sm hover:border-[#1B4332]"
            >
              {viewMode === 'list' ? 'Map view' : 'List view'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 md:flex-row">
          <aside className="w-full rounded-2xl border border-[#E8E6E1] bg-white p-4 text-xs md:w-80">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1A1A1A]">Filters</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-semibold text-[#52B788] hover:text-[#1B4332]"
              >
                Reset all
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Price range */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Price range</span>
                  <span className="text-[11px] text-[#4A4A4A]">{formatPrice(minPrice)} — {formatPrice(maxPrice)}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={25000}
                    value={minPrice === PRICE_MIN ? '' : minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Math.min(Number(e.target.value), maxPrice - 1) : PRICE_MIN)}
                    placeholder="$100k"
                    className="w-24 rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
                  />
                  <input
                    type="number"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={25000}
                    value={maxPrice === PRICE_MAX ? '' : maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Math.max(Number(e.target.value), minPrice + 1) : PRICE_MAX)}
                    placeholder="$10M"
                    className="w-24 rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
                  />
                </div>
                <div className="mt-1 flex gap-1">
                  <input
                    type="range"
                    min={PRICE_MIN}
                    max={maxPrice - 25000}
                    step={25000}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="flex-1 accent-[#1B4332]"
                  />
                  <input
                    type="range"
                    min={minPrice + 25000}
                    max={PRICE_MAX}
                    step={25000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="flex-1 accent-[#1B4332]"
                  />
                </div>
              </div>

              {/* Beds */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Beds</span>
                <div className="flex flex-wrap gap-2">
                  {([null, 1, 2, 3, 4, 5] as const).map((v) => (
                    <button
                      key={v ?? 'any'}
                      type="button"
                      onClick={() => setBeds(v)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${beds === v ? 'bg-[#1B4332] text-white' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}
                    >
                      {v == null ? 'Any' : `${v}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baths */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Baths</span>
                <div className="flex flex-wrap gap-2">
                  {([null, 1, 2, 3] as const).map((v) => (
                    <button
                      key={v ?? 'any'}
                      type="button"
                      onClick={() => setBaths(v)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${baths === v ? 'bg-[#1B4332] text-white' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}
                    >
                      {v == null ? 'Any' : `${v}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property type */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Property type</span>
                <div className="space-y-1">
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={types.includes(value)}
                        onChange={() => handleToggleType(value)}
                        className="h-3.5 w-3.5 rounded border-[#E8E6E1] text-[#1B4332]"
                      />
                      <span className="text-[#1A1A1A]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Square footage */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Square footage</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minSqft ?? ''}
                    onChange={(e) => setMinSqft(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxSqft ?? ''}
                    onChange={(e) => setMaxSqft(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Year built */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Built after</span>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={yearBuiltMin ?? ''}
                  onChange={(e) => setYearBuiltMin(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A]"
                />
              </div>

              {/* Parking */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Parking</span>
                <div className="flex flex-wrap gap-2">
                  {(['any', '1+', '2+'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setParking(v)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${parking === v ? 'bg-[#1B4332] text-white' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}
                    >
                      {v === 'any' ? 'Any' : v === '1+' ? '1+ garage' : '2+ garage'}
                    </button>
                  ))}
                </div>
              </div>

              {/* HOA */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">HOA</span>
                <div className="flex flex-wrap gap-2">
                  {(['any', 'no', 'yes'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setHoa(v)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${hoa === v ? 'bg-[#1B4332] text-white' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}
                    >
                      {v === 'any' ? 'Any' : v === 'no' ? 'No HOA' : 'Has HOA'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">Keywords</span>
                <input
                  type="text"
                  placeholder="pool, fireplace, etc."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-sm text-[#1A1A1A] placeholder:text-[#888888]"
                />
              </div>
            </div>
          </aside>

          <section className="flex-1 rounded-2xl border border-[#E8E6E1] bg-white p-3 shadow-sm sm:p-4">
            {error && (
              <div className="mb-3 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-[11px] text-rose-800">{error}</div>
            )}

            {loading ? (
              <LoadingSkeleton variant="propertyList" />
            ) : viewMode === 'map' ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] py-16 text-[#4A4A4A]">
                <p className="text-lg font-medium">Map coming soon</p>
                <p className="mt-1 text-sm">We’re building map view. Use list view in the meantime.</p>
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-[#4A4A4A]">
                <div className="mb-3 text-4xl">🔍</div>
                <p className="text-sm">No homes match your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#1A1A1A]">
                    {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'home' : 'homes'} found
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-lg border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#52B788]/40"
                  >
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="beds_desc">Most beds</option>
                    <option value="sqft_desc">Largest sqft</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSorted.map((p) => (
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
                      image_url={p.image_url}
                      href={`/properties/${p.id}`}
                      showSave
                      saved={savedIds.has(p.id)}
                      onSaveClick={(e) => handleSaveClick(e, p.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
