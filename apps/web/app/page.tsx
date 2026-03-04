import type { Metadata } from 'next';
import Link from 'next/link';

import { SearchBar } from '@/components/SearchBar';
import { supabase } from '@/lib/supabase';
import { PropertyCard } from '@/components/PropertyCard';
import { HomepageStats } from '@/components/HomepageStats';

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
  image_url: string | null;
};

async function getFeaturedProperties(): Promise<Property[]> {
  const { data } = await supabase
    .from('properties')
    .select(
      'id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url',
    )
    .order('created_at', { ascending: false })
    .limit(6);

  return (data ?? []) as Property[];
}

async function getListingCount(): Promise<number> {
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export const metadata: Metadata = {
  title: 'Find your dream home',
  description:
    'Explore live listings across top U.S. markets, track your favorites, and move from discovery to closing entirely online.',
  openGraph: {
    title: 'HomeBase — Find your dream home',
    description:
      'Explore live listings across top U.S. markets, track your favorites, and move from discovery to closing entirely online.',
  },
};

export default async function HomePage() {
  const [featured, listingCount] = await Promise.all([
    getFeaturedProperties(),
    getListingCount(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <section className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512914890250-353c97c9e7e2?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-slate-950" />

        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
              Find your dream home
            </p>
            <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Zillow-level search,
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
                {' '}
                built for you.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-200 sm:text-base">
              Explore live listings across top U.S. markets, track your
              favorites, and move from discovery to closing entirely online.
            </p>
          </div>

          <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/60 backdrop-blur">
            <div className="mb-2">
              <label
                htmlFor="hero-search"
                className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300"
              >
                City, neighborhood, or address
              </label>
              <SearchBar
                placeholder="Seattle, WA or 98109"
                className="[&_input]:border-white/10 [&_input]:bg-black/40 [&_input]:text-slate-50 [&_input]:placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <Link
                href="/properties"
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Browse all homes
              </Link>
              <Link
                href="/properties"
                className="hidden h-11 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 text-xs font-semibold text-slate-50 hover:border-emerald-400 sm:flex"
              >
                Advanced filters
              </Link>
            </div>
          </div>

          <HomepageStats listingCount={listingCount} />

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              What buyers &amp; sellers say
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <blockquote className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200">
                &ldquo;Closed in 28 days. The digital offer and verification process was seamless.&rdquo;
                <footer className="mt-2 text-xs text-slate-400">— Sarah M., Seattle</footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200">
                &ldquo;Finally, a platform that only sends me verified buyers. No more flaky showings.&rdquo;
                <footer className="mt-2 text-xs text-slate-400">— James T., Austin</footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200">
                &ldquo;Saved over $15k in fees compared to our last purchase. Same great experience.&rdquo;
                <footer className="mt-2 text-xs text-slate-400">— Michelle L., Denver</footer>
              </blockquote>
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  Featured homes
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Live listings across top markets.
                </p>
              </div>
              <Link
                href="/properties"
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  price={property.price}
                  beds={property.bedrooms}
                  baths={property.bathrooms}
                  sqft={property.sqft}
                  imageUrl={property.image_url}
                  href={`/properties/${property.id}`}
                />
              ))}
              {featured.length === 0 && (
                <p className="text-sm text-slate-400">
                  No featured properties yet. Add properties in Supabase to see
                  them here.
                </p>
              )}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}


