'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
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
  image_url?: string | null;
  images?: string[] | null;
  featured?: boolean;
};

function getDisplayImage(p: Property): string | null {
  return p.image_url ?? p.images?.[0] ?? null;
}

const HOW_IT_WORKS = [
  { step: 1, title: 'Browse verified listings', desc: 'Search homes without being tracked by agents or bombarded with calls.', icon: '🔍' },
  { step: 2, title: 'Submit your offer directly', desc: 'Make a binding offer straight to the seller. No middleman.', icon: '📋' },
  { step: 3, title: 'Get verified', desc: "Complete identity verification so sellers know you're serious.", icon: '✅' },
  { step: 4, title: 'Lenders compete for you', desc: 'Once your offer is accepted, our network of lenders submit their best rates. You compare and choose.', icon: '🏦' },
  { step: 5, title: 'Track every step', desc: "Your 9-stage pipeline tells you exactly where you are and what's next — no more chasing your agent for updates.", icon: '📊' },
  { step: 6, title: 'Close with confidence', desc: "We guide you through inspection, appraisal, and closing. You're never alone.", icon: '🔑' },
];

const TESTIMONIALS = [
  { quote: 'I saved $31,000 on my Austin home. The process was actually easier than when I used an agent.', name: 'Sarah M.', location: 'Austin TX' },
  { quote: "I was nervous to buy without an agent. HomeBase walked me through every single step. I never felt lost.", name: 'Marcus T.', location: 'Dallas TX' },
  { quote: 'The lender marketplace alone was worth it. I got a rate 0.4% lower than my bank offered.', name: 'Jennifer K.', location: 'Jacksonville FL' },
];

function CountUp({ end, duration = 600 }: { end: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current || started) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setStarted(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setValue(Math.round(start + (end - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}

export function HomePageContent({
  featuredProperties,
  listingCount,
  heroPhotos,
}: {
  featuredProperties: Property[];
  listingCount: number;
  heroPhotos: Property[];
}) {
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-bg-base)] px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-6xl lg:flex lg:items-start lg:justify-between lg:gap-12"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="max-w-xl">
            <motion.h1
              className="font-display text-4xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl"
              variants={item}
              transition={{ duration: 0.3 }}
            >
              Buy your home.
              <br />
              <span className="italic text-[var(--color-brand-primary)]">Keep the commission.</span>
            </motion.h1>
            <motion.p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]" variants={item} transition={{ duration: 0.3 }}>
              HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.
            </motion.p>
            <motion.form action="/properties" method="get" className="mt-8" variants={item} transition={{ duration: 0.3 }}>
              <div className="flex overflow-hidden rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]">
                <div className="flex flex-1 items-center gap-3 pl-5">
                  <svg className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    name="search"
                    placeholder="Search by city, neighborhood, or ZIP"
                    className="min-w-0 flex-1 bg-transparent py-4 font-body text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <button type="submit" className="shrink-0 bg-[var(--color-brand-primary)] px-6 py-3.5 font-body text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors">
                  Search
                </button>
              </div>
            </motion.form>
            <motion.div className="mt-4 flex flex-wrap gap-3" variants={item} transition={{ duration: 0.3 }}>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-body text-sm text-[var(--color-text-secondary)]">
                🏡 {listingCount} homes listed
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-body text-sm text-[var(--color-text-secondary)]">
                💰 $23,000 avg. buyer savings
              </span>
            </motion.div>
          </div>
          <motion.div className="mt-12 hidden lg:block lg:mt-0 lg:shrink-0" variants={item}>
            <div className="relative flex gap-4">
              {heroPhotos.length > 0 ? (
                heroPhotos.map((p, i) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl bg-[#d4edda]"
                    style={{ width: i === 0 ? 200 : 160, marginTop: i === 0 ? 0 : i * 24, zIndex: 3 - i }}
                  >
                    {getDisplayImage(p) ? (
                      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getDisplayImage(p)!} alt={p.address ?? ''} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#c8e6c9] text-4xl" style={{ aspectRatio: '4/3' }}>🏡</div>
                    )}
                    <div className="p-3 font-body text-sm font-medium text-[var(--color-text-primary)]">
                      {p.price != null ? `$${Number(p.price).toLocaleString()}` : '—'} · {p.city ?? ''}{p.city && p.state ? ', ' : ''}{p.state ?? ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-48 w-48 rounded-xl border border-[var(--color-border)] bg-warm-subtle" />
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust bar with count-up */}
      <motion.section
        className="border-y border-[var(--color-border)] bg-warm-subtle py-6"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="font-body text-base font-medium text-[var(--color-text-primary)]">
            No agents. No commissions. Just you, the seller, and a better way to buy.
          </p>
          <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
            <CountUp end={6} duration={800} />% avg. commission eliminated · $<CountUp end={23000} duration={800} />+ avg. savings · <CountUp end={9} duration={600} />-step guided process
          </p>
        </div>
      </motion.section>

      {/* How it works */}
      <section className="bg-[var(--color-bg-base)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">How HomeBase works</h2>
          <p className="mt-2 font-body text-lg text-[var(--color-text-secondary)]">We do everything a buyer&apos;s agent would do — minus the 3% fee.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                className="flex gap-4"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] font-mono text-sm font-semibold text-[var(--color-text-inverse)]">{item.step}</span>
                <div>
                  <h3 className="font-body text-lg font-semibold text-[var(--color-text-primary)]">{item.icon} {item.title}</h3>
                  <p className="mt-1 font-body text-sm text-[var(--color-text-muted)]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings calculator */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <SavingsCalculator variant="dark" />
      </motion.div>

      {/* Featured listings */}
      <section className="bg-[var(--color-bg-base)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">Homes for sale right now</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProperties.length > 0
              ? featuredProperties.map((property, i) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
                  >
                    <PropertyCard
                      id={property.id}
                      title={property.title}
                      address={property.address}
                      city={property.city}
                      state={property.state}
                      price={property.price}
                      beds={property.bedrooms}
                      baths={property.bathrooms}
                      sqft={property.sqft}
                      imageUrl={getDisplayImage(property)}
                      image_url={property.image_url}
                      href={`/properties/${property.id}`}
                      featured={property.featured ?? false}
                    />
                  </motion.div>
                ))
              : null}
          </div>
          {featuredProperties.length === 0 && (
            <p className="mt-4 font-body text-[var(--color-text-muted)]">No listings yet. Check back soon.</p>
          )}
          <div className="mt-8">
            <Link href="/properties" className="inline-flex items-center gap-1 font-body text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-light)]">
              Browse all homes →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-warm-subtle px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">Built for buyers who do their homework</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={i}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-card)]"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <span className="font-display text-4xl italic text-[var(--color-brand-primary)]">&ldquo;</span>
                <p className="mt-2 font-display text-lg italic text-[var(--color-text-primary)]">{t.quote}</p>
                <footer className="mt-4 font-body text-sm text-[var(--color-text-muted)]">— {t.name}, {t.location}</footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA */}
      <section className="bg-[var(--color-brand-primary)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold text-[var(--color-text-inverse)] sm:text-4xl">Selling? Keep your equity.</h2>
          <p className="mt-4 font-body text-lg text-[var(--color-brand-primary-subtle)]">
            List your home for a flat $500 fee. No listing agent. No 3% commission. Just a professional listing and direct offers from verified buyers.
          </p>
          <Link
            href="/sell"
            className="mt-8 inline-block rounded-full border-2 border-[var(--color-brand-primary-light)] bg-transparent px-8 py-3.5 font-body text-base font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-light)] transition-colors"
          >
            List your home free →
          </Link>
        </div>
      </section>
    </>
  );
}
