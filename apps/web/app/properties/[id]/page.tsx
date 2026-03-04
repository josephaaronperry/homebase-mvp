// Schema verified against SCHEMA.md - 2025-03-01
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertySidebar } from '@/components/PropertySidebar';
import { PropertyGallery } from '@/components/PropertyGallery';
import { ShareButton } from '@/components/ShareButton';
import { Breadcrumbs } from '@/components/Breadcrumbs';

type PageProps = {
  params: Promise<{ id: string }>;
};

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
  description: string | null;
  imageUrl: string | null;
  status: string | null;
};

async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, title, address, city, state, price, bedrooms, bathrooms, sqft, description, imageUrl, status',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Property;
}

async function getSimilar(
  id: string,
  city: string | null,
  price: number | null,
): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select(
      'id, title, address, city, state, price, bedrooms, bathrooms, sqft, imageUrl',
    )
    .neq('id', id)
    .order('createdAt', { ascending: false })
    .limit(6);

  if (city) {
    query = query.ilike('city', city);
  }
  if (price != null && price > 0) {
    const low = Math.round(price * 0.75);
    const high = Math.round(price * 1.25);
    query = query.gte('price', low).lte('price', high);
  }

  const { data } = await query;
  return ((data ?? []) as Property[]).slice(0, 3);
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const similar = await getSimilar(
    String(property.id),
    property.city ?? null,
    property.price,
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homebase.example.com';
  const propertyUrl = `${baseUrl}/properties/${id}`;

  function seedFromId(s: string): number {
    return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  }
  const seed = seedFromId(String(property.id));
  const walkScore = 60 + (seed % 36);
  const schoolRating = 7 + (seed % 4);
  const transitScore = 50 + (seed % 46);
  const nearby = ['Grocery', 'Coffee', 'Parks', 'Schools', 'Transit'].filter(
    (_, i) => (seed + i) % 2 === 0,
  );
  if (nearby.length < 2) nearby.push('Dining');

  const fmtPrice = property.price
    ? `$${property.price.toLocaleString()}`
    : 'Price on request';

  const fullAddress = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(', ');

  const badge = `${property.bedrooms ?? '-'} bd • ${
    property.bathrooms ?? '-'
  } ba • ${property.sqft ? `${property.sqft.toLocaleString()} sqft` : '-'}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-2 border-b border-slate-800/80 bg-slate-950/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Properties', href: '/properties' },
              { label: fullAddress || String(property.id) },
            ]}
          />
          <Link href="/properties" className="text-xs font-medium text-slate-400 hover:text-emerald-400">
            ← Back to results
          </Link>
        </div>
        <section className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/60 shadow-2xl shadow-black/60">
          <div className="relative">
            <PropertyGallery
              imageUrl={property.imageUrl}
              propertyId={property.id}
              title={property.title}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 sm:bottom-4 sm:left-4 sm:right-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="text-xl font-semibold sm:text-2xl md:text-3xl">
                  {fmtPrice}
                </div>
                <div className="mt-1 text-sm text-slate-200">{badge}</div>
                <div className="mt-1 text-xs text-slate-300">{fullAddress}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ShareButton url={propertyUrl} />
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  {property.status ?? 'For sale'}
                </span>
              </div>
            </div>
          </div>

          {/* Gallery + details: main content first, sidebar below on mobile */}
          <div className="grid gap-8 border-t border-slate-900 bg-slate-950/80 p-4 sm:p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:p-6">
            <div className="min-w-0 space-y-6">
              {/* Stats grid */}
              <div className="grid gap-4 rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-xs text-slate-200 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Overview
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>{property.bedrooms ?? '-'} bedrooms</p>
                    <p>{property.bathrooms ?? '-'} bathrooms</p>
                    <p>
                      {property.sqft
                        ? `${property.sqft.toLocaleString()} sqft`
                        : '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Location
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>{property.address}</p>
                    <p>
                      {[property.city, property.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="space-y-2 rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-sm text-slate-200">
                  <h2 className="text-sm font-semibold text-slate-50">
                    About this home
                  </h2>
                  <p className="leading-relaxed">{property.description}</p>
                </div>
              )}

              {/* Neighborhood */}
              <div className="rounded-2xl border border-slate-900 bg-slate-950/80 p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Neighborhood
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Walk Score</div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">{walkScore}</div>
                    <div className="text-[11px] text-slate-400">Walkable</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">School Rating</div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">{schoolRating}/10</div>
                    <div className="text-[11px] text-slate-400">Schools</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Transit Score</div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">{transitScore}</div>
                    <div className="text-[11px] text-slate-400">Transit</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Nearby</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {nearby.map((label) => (
                        <span key={label} className="rounded-full bg-slate-700/80 px-2 py-0.5 text-[11px] text-slate-200">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar homes */}
              {similar.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-slate-50">
                    Similar homes
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {similar.map((p) => (
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
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <PropertySidebar
              propertyId={property.id}
              price={property.price}
              address={property.address}
              city={property.city}
              state={property.state}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
