import { notFound } from 'next/navigation';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertySidebar } from '@/components/PropertySidebar';

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
  image_url: string | null;
  status: string | null;
};

async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, title, address, city, state, price, bedrooms, bathrooms, sqft, description, image_url, status',
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Property;
}

async function getSimilar(id: string, city: string | null): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select(
      'id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url',
    )
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(4);

  if (city) {
    query = query.ilike('city', city);
  }

  const { data } = await query;
  return (data ?? []) as Property[];
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
  );

  const heroImage =
    property.image_url ??
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80';

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
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-2 border-b border-slate-800/80 bg-slate-950/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Link
            href="/properties"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-emerald-400"
          >
            ← Back to results
          </Link>
        </div>
        <section className="overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/60 shadow-2xl shadow-black/60">
          {/* Hero image */}
          <div className="relative h-72 w-full sm:h-80 md:h-96">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={property.title ?? ''}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-2xl font-semibold sm:text-3xl">
                  {fmtPrice}
                </div>
                <div className="mt-1 text-sm text-slate-200">{badge}</div>
                <div className="mt-1 text-xs text-slate-300">{fullAddress}</div>
              </div>
              <div className="flex gap-2 text-[11px]">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  {property.status ?? 'For sale'}
                </span>
              </div>
            </div>
          </div>

          {/* Gallery + details */}
          <div className="grid gap-8 border-t border-slate-900 bg-slate-950/80 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:p-6">
            <div className="space-y-6">
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
              <div className="grid gap-4 rounded-2xl border border-slate-900 bg-slate-950/80 p-4 text-xs text-slate-200 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    Neighborhood
                  </div>
                  <div className="mt-2 space-y-2">
                    <p><span className="text-slate-500">Walk Score:</span> — (placeholder)</p>
                    <p><span className="text-slate-500">School ratings:</span> — (placeholder)</p>
                    <p><span className="text-slate-500">Crime index:</span> — (placeholder)</p>
                    <p><span className="text-slate-500">Nearby:</span> Parks, schools, transit (placeholder)</p>
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
                        imageUrl={p.image_url}
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
