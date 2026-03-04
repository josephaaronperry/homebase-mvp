import type { Metadata } from 'next';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { PropertyCard } from '@/components/PropertyCard';
import { SavingsCalculator } from '@/components/SavingsCalculator';

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
  featured?: boolean;
};

async function getFeaturedProperties(): Promise<Property[]> {
  const { data } = await supabase
    .from('properties')
    .select('id, title, address, city, state, price, bedrooms, bathrooms, sqft, imageUrl, featured')
    .eq('status', 'ACTIVE')
    .order('createdAt', { ascending: false })
    .limit(6);
  return (data ?? []) as Property[];
}

async function getListingCount(): Promise<number> {
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');
  return count ?? 0;
}

export const metadata: Metadata = {
  title: 'Buy your home. Keep the commission.',
  description:
    'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  openGraph: {
    title: 'HomeBase — Buy your home. Keep the commission.',
    description:
      'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  },
};

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Browse verified listings',
    desc: 'Search homes without being tracked by agents or bombarded with calls.',
    icon: '🔍',
  },
  {
    step: 2,
    title: 'Submit your offer directly',
    desc: 'Make a binding offer straight to the seller. No middleman.',
    icon: '📋',
  },
  {
    step: 3,
    title: 'Get verified',
    desc: "Complete identity verification so sellers know you're serious.",
    icon: '✅',
  },
  {
    step: 4,
    title: 'Lenders compete for you',
    desc: 'Once your offer is accepted, our network of lenders submit their best rates. You compare and choose.',
    icon: '🏦',
  },
  {
    step: 5,
    title: 'Track every step',
    desc: "Your 9-stage pipeline tells you exactly where you are and what's next — no more chasing your agent for updates.",
    icon: '📊',
  },
  {
    step: 6,
    title: 'Close with confidence',
    desc: 'We guide you through inspection, appraisal, and closing. You\'re never alone.',
    icon: '🔑',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I saved $31,000 on my Austin home. The process was actually easier than when I used an agent.',
    name: 'Sarah M.',
    location: 'Austin TX',
  },
  {
    quote: "I was nervous to buy without an agent. HomeBase walked me through every single step. I never felt lost.",
    name: 'Marcus T.',
    location: 'Dallas TX',
  },
  {
    quote: 'The lender marketplace alone was worth it. I got a rate 0.4% lower than my bank offered.',
    name: 'Jennifer K.',
    location: 'Jacksonville FL',
  },
];

export default async function HomePage() {
  const [featured, listingCount] = await Promise.all([
    getFeaturedProperties(),
    getListingCount(),
  ]);
  const heroPhotos = featured.slice(0, 3);
  const featuredGrid = featured.slice(0, 4);

  return (
    <>
      {/* Section 2 — Hero */}
      <section className="bg-[var(--color-bg-base)] px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl lg:flex lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
              Buy your home.
              <br />
              <span className="italic text-[var(--color-brand-primary)]">Keep the commission.</span>
            </h1>
            <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
              HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.
            </p>

            <form action="/properties" method="get" className="mt-8">
              <div className="flex overflow-hidden rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]">
                <div className="flex flex-1 items-center gap-3 pl-5">
                  <svg className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    name="q"
                    placeholder="Search by city, neighborhood, or ZIP"
                    className="min-w-0 flex-1 bg-transparent py-4 font-body text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 bg-[var(--color-brand-primary)] px-6 py-3.5 font-body text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-body text-sm text-[var(--color-text-secondary)]">
                🏡 {listingCount} homes listed
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-body text-sm text-[var(--color-text-secondary)]">
                💰 $23,000 avg. buyer savings
              </span>
            </div>
          </div>

          {/* Desktop: stacked mosaic of 3 property photos */}
          <div className="mt-12 hidden lg:block lg:mt-0 lg:shrink-0">
            <div className="relative flex gap-4">
              {heroPhotos.length > 0 ? (
                heroPhotos.map((p, i) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card-hover)]"
                    style={{
                      width: i === 0 ? 200 : 160,
                      marginTop: i === 0 ? 0 : i * 24,
                      zIndex: 3 - i,
                    }}
                  >
                    <div className="aspect-[4/3] w-full">
                      {p.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-warm-subtle" />
                      )}
                    </div>
                    <div className="p-3 font-body text-sm font-medium text-[var(--color-text-primary)]">
                      {p.price != null ? `$${Number(p.price).toLocaleString()}` : '—'} · {p.city ?? ''}{p.city && p.state ? ', ' : ''}{p.state ?? ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-48 w-48 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-warm-subtle" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Trust bar */}
      <section className="border-y border-[var(--color-border)] bg-warm-subtle py-6">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="font-body text-base font-medium text-[var(--color-text-primary)]">
            No agents. No commissions. Just you, the seller, and a better way to buy.
          </p>
          <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
            5–6% avg. commission eliminated · $23,000+ avg. savings · 9-step guided process
          </p>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <section className="bg-[var(--color-bg-base)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
            How HomeBase works
          </h2>
          <p className="mt-2 font-body text-lg text-[var(--color-text-secondary)]">
            We do everything a buyer&apos;s agent would do — minus the 3% fee.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] font-mono text-sm font-semibold text-[var(--color-text-inverse)]">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-body text-lg font-semibold text-[var(--color-text-primary)]">
                    {item.icon} {item.title}
                  </h3>
                  <p className="mt-1 font-body text-sm text-[var(--color-text-muted)]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Savings calculator (dark) */}
      <SavingsCalculator variant="dark" />

      {/* Section 6 — Featured listings */}
      <section className="bg-[var(--color-bg-base)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
            Homes for sale right now
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGrid.map((property) => (
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
                imageUrl={property.imageUrl}
                href={`/properties/${property.id}`}
                featured={property.featured ?? false}
              />
            ))}
          </div>
          {featuredGrid.length === 0 && (
            <p className="font-body text-[var(--color-text-muted)]">
              No listings yet. Check back soon.
            </p>
          )}
          <div className="mt-8">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1 font-body text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-light)]"
            >
              Browse all homes →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 7 — Social proof */}
      <section className="bg-warm-subtle px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
            Built for buyers who do their homework
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={i}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-card)]"
              >
                <span className="font-display text-4xl italic text-[var(--color-brand-primary)]">&ldquo;</span>
                <p className="mt-2 font-display text-lg italic text-[var(--color-text-primary)]">
                  {t.quote}
                </p>
                <footer className="mt-4 font-body text-sm text-[var(--color-text-muted)]">
                  — {t.name}, {t.location}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 — Seller CTA */}
      <section className="bg-[var(--color-brand-primary)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-inverse)] sm:text-4xl">
            Selling? Keep your equity.
          </h2>
          <p className="mt-4 font-body text-lg text-[var(--color-brand-primary-subtle)]">
            List your home for a flat $500 fee. No listing agent. No 3% commission. Just a professional listing and direct offers from verified buyers.
          </p>
          <Link
            href="/sell/list"
            className="mt-8 inline-block rounded-full border-2 border-[var(--color-brand-primary-light)] bg-transparent px-8 py-3.5 font-body text-base font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors"
          >
            List your home free →
          </Link>
        </div>
      </section>

      {/* Section 9 — Footer is in layout Footer component; we only have sections 1–8 here */}
    </>
  );
}
