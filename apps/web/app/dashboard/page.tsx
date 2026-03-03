'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();
import { PropertyCard } from '@/components/PropertyCard';

type SavedPreview = {
  id: string | number;
  property_id: string | number;
  price: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  image_url: string | null;
  title: string | null;
};

type ShowingPreview = {
  id: string | number;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  scheduled_at: string | null;
  tour_type: string | null;
};

type OfferPreview = {
  id: string | number;
  price: number | null;
  status: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
};

type ViewedProperty = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  image_url: string | null;
};

type PipelinePreview = {
  id: string;
  property_id: string;
  current_stage: string;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_price: number | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState({ saved: 0, total: 0 });
  const [saved, setSaved] = useState<SavedPreview[]>([]);
  const [showings, setShowings] = useState<ShowingPreview[]>([]);
  const [offers, setOffers] = useState<OfferPreview[]>([]);
  const [viewed, setViewed] = useState<ViewedProperty[]>([]);
  const [acceptedOffer, setAcceptedOffer] = useState<OfferPreview | null>(null);
  const [pipelines, setPipelines] = useState<PipelinePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setEmail(user.email ?? null);
      setUserName((user.user_metadata as { full_name?: string })?.full_name ?? user.email ?? 'there');

      const [
        { count: totalProperties },
        { count: savedCount },
        savedRes,
        showingsRes,
        offersRes,
        kycRes,
        viewedRes,
        pipelinesRes,
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('saved_properties').select('*', { count: 'exact', head: true }),
        supabase
          .from('saved_properties_with_details')
          .select(
            'id, property_id, price, address, city, state, bedrooms, bathrooms, sqft, image_url, title',
          )
          .limit(6),
        supabase
          .from('showings')
          .select(
            'id, property_address, property_city, property_state, scheduled_at, tour_type',
          )
          .gte('scheduled_at', new Date().toISOString())
          .neq('status', 'CANCELLED')
          .order('scheduled_at', { ascending: true })
          .limit(3),
        supabase
          .from('offers')
          .select(
            'id, price, status, property_address, property_city, property_state',
          )
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('kyc_submissions')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('property_views')
          .select('property_id')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(4),
        supabase
          .from('buying_pipelines')
          .select('id, property_id, current_stage')
          .eq('user_id', user.id)
          .neq('current_stage', 'closing'),
      ]);

      setStats({
        total: totalProperties ?? 0,
        saved: savedCount ?? 0,
      });
      setSaved((savedRes.data ?? []) as SavedPreview[]);
      setShowings((showingsRes.data ?? []) as ShowingPreview[]);
      const offersData = (offersRes.data ?? []) as OfferPreview[];
      setOffers(offersData);
      const accepted = offersData.find((o) => o.status === 'ACCEPTED') ?? null;
      setAcceptedOffer(accepted);
      const kyc = (kycRes.data as { status?: string } | null)?.status ?? null;
      setKycStatus(kyc);
      setIsVerified(kyc === 'APPROVED');

      const viewedIds = (viewedRes.data ?? [])
        .map((v: { property_id: string }) => v.property_id)
        .filter(Boolean);
      if (viewedIds.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, title, address, city, state, price, image_url')
          .in('id', viewedIds);
        setViewed((props ?? []) as ViewedProperty[]);
      }

      const pipelineRows = (pipelinesRes.data ?? []) as { id: string; property_id: string; current_stage: string }[];
      if (pipelineRows.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, address, city, state, price')
          .in('id', pipelineRows.map((p) => p.property_id));
        const propMap = new Map((props ?? []).map((p: { id: string; address: string | null; city: string | null; state: string | null; price: number | null }) => [p.id, p]));
        setPipelines(
          pipelineRows.map((row) => ({
            id: row.id,
            property_id: row.property_id,
            current_stage: row.current_stage,
            property_address: (propMap.get(row.property_id) as { address: string | null } | undefined)?.address ?? null,
            property_city: (propMap.get(row.property_id) as { city: string | null } | undefined)?.city ?? null,
            property_state: (propMap.get(row.property_id) as { state: string | null } | undefined)?.state ?? null,
            property_price: (propMap.get(row.property_id) as { price: number | null } | undefined)?.price ?? null,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const statusColor = (s: string | null) => {
    if (s === 'ACCEPTED') return 'bg-emerald-500/15 text-emerald-300';
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'bg-sky-500/15 text-sky-300';
    if (s === 'REJECTED') return 'bg-rose-500/15 text-rose-300';
    return 'bg-slate-700/60 text-slate-200';
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60"
          >
            HomeBase
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            {email && (
              <span className="hidden max-w-[10rem] truncate sm:inline-block">
                {email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 hover:border-emerald-500/60"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Welcome header with verification badge */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Welcome back, {userName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  ✓ Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-400">
                  Identity not verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification status banner */}
        {isVerified && (
          <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4">
            <p className="text-sm font-medium text-emerald-100">
              Identity verified — you can make offers.
            </p>
          </div>
        )}
        {kycStatus === 'PENDING' || kycStatus === 'UNDER_REVIEW' ? (
          <div className="mb-6 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-5 py-4">
            <p className="text-sm font-medium text-sky-100">
              Your verification is under review — usually within 24 hours.
            </p>
          </div>
        ) : !isVerified && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-amber-100">
                Complete identity verification to unlock making offers on properties.
              </p>
              <Link
                href="/verify"
                className="flex-shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Verify now
              </Link>
            </div>
          </div>
        )}

        {/* Empty state: getting started */}
        {!loading && stats.saved === 0 && showings.length === 0 && offers.length === 0 && !acceptedOffer && (
          <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
            <h2 className="text-lg font-semibold text-slate-50">Getting started</h2>
            <p className="mt-1 text-sm text-slate-400">Follow these steps to find and secure your next home.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-emerald-500/50">
                <span className="text-2xl">1</span>
                <div>
                  <div className="font-medium text-slate-50">Browse homes</div>
                  <div className="text-xs text-slate-400">Explore listings in your market.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-emerald-500/50">
                <span className="text-2xl">2</span>
                <div>
                  <div className="font-medium text-slate-50">Save favorites</div>
                  <div className="text-xs text-slate-400">Heart homes to revisit later.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-emerald-500/50">
                <span className="text-2xl">3</span>
                <div>
                  <div className="font-medium text-slate-50">Schedule a tour</div>
                  <div className="text-xs text-slate-400">Book in-person or virtual showings.</div>
                </div>
              </Link>
              <Link href="/verify" className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-emerald-500/50">
                <span className="text-2xl">4</span>
                <div>
                  <div className="font-medium text-slate-50">Get verified</div>
                  <div className="text-xs text-slate-400">Complete identity verification.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 hover:border-emerald-500/50">
                <span className="text-2xl">5</span>
                <div>
                  <div className="font-medium text-slate-50">Make an offer</div>
                  <div className="text-xs text-slate-400">Submit offers from any property.</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Active transaction card */}
        {acceptedOffer && (
          <Link
            href={`/transaction/${acceptedOffer.id}`}
            className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Active transaction
              </p>
              <p className="mt-1 font-medium text-slate-50">
                {acceptedOffer.property_address}
              </p>
              <p className="text-sm text-slate-400">
                Offer accepted • Track progress
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              {acceptedOffer.status}
            </span>
          </Link>
        )}

        {/* Active transactions (buying pipelines) */}
        {pipelines.length > 0 && (
          <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Active transactions
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Properties you’re pursuing — track each deal in the buying pipeline.
            </p>
            <div className="mt-4 space-y-2">
              {pipelines.map((pipe) => (
                <Link
                  key={pipe.id}
                  href={`/dashboard/buying/${pipe.property_id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 hover:border-emerald-500/50"
                >
                  <div>
                    <p className="font-medium text-slate-50">
                      {pipe.property_address ?? 'Property'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {pipe.property_city}, {pipe.property_state}
                      {pipe.property_price != null && ` • $${pipe.property_price.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-700/60 px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-300">
                      {pipe.current_stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="mb-6 grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-black/40">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                Overview
              </p>
              <h2 className="mt-3 text-lg font-semibold text-slate-50">
                Your buyer command center
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Track saved homes, upcoming showings, and stay on top of your next move.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Saved homes
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {loading ? '—' : stats.saved}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Total listings
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {loading ? '—' : stats.total}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/properties"
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 hover:border-emerald-500/60"
              >
                <span className="text-lg">🔍</span>
                <div>
                  <div className="text-sm font-medium text-slate-50">
                    Browse listings
                  </div>
                  <div className="text-xs text-slate-400">
                    Explore homes across your target markets.
                  </div>
                </div>
              </Link>
              <Link
                href="/saved"
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 hover:border-emerald-500/60"
              >
                <span className="text-lg">❤️</span>
                <div>
                  <div className="text-sm font-medium text-slate-50">
                    Saved homes
                  </div>
                  <div className="text-xs text-slate-400">
                    Quickly revisit homes you love.
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <aside className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
                Upcoming showings
              </p>
              <Link
                href="/showings"
                className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
              >
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
                  />
                ))}
              </div>
            ) : showings.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">
                No upcoming showings. Schedule a tour from any property page.
              </p>
            ) : (
              <div className="space-y-2">
                {showings.map((s) => (
                  <Link
                    key={s.id}
                    href="/showings"
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 hover:border-emerald-500/40"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-100">
                        {s.property_address}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.property_city}, {s.property_state}
                      </div>
                      {s.tour_type && (
                        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                          {s.tour_type === 'VIRTUAL' ? 'Virtual' : 'In-person'}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      {s.scheduled_at
                        ? new Date(s.scheduled_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'TBD'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Saved homes preview */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="mb-3 flex items-center justify-between text-xs">
              <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">
                Saved homes
              </p>
              <Link
                href="/saved"
                className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
              >
                View all ({stats.saved}) →
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/80"
                  />
                ))}
              </div>
            ) : saved.length === 0 ? (
              <p className="py-6 text-xs text-slate-500">
                You have no saved homes yet. Browse listings and tap the heart icon to save.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {saved.slice(0, 4).map((s) => (
                  <PropertyCard
                    key={s.id}
                    id={s.property_id}
                    title={s.title}
                    address={s.address}
                    city={s.city}
                    state={s.state}
                    price={s.price}
                    beds={s.bedrooms}
                    baths={s.bathrooms}
                    sqft={s.sqft}
                    imageUrl={s.image_url}
                    href={`/properties/${s.property_id}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Recent offers */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Recent offers
                </p>
                <Link
                  href="/offers"
                  className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  View all →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl border border-slate-800 bg-slate-900/80"
                    />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <p className="py-4 text-xs text-slate-500">
                  No offers yet. Make an offer from any property page.
                </p>
              ) : (
                <div className="space-y-2">
                  {offers.slice(0, 3).map((o) => (
                    <Link
                      key={o.id}
                      href={`/transaction/${o.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 hover:border-emerald-500/40"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-100">
                          ${o.price?.toLocaleString() ?? '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {o.property_address}
                        </div>
                      </div>
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ' +
                          statusColor(o.status)
                        }
                      >
                        {o.status ?? '—'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Market activity */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="font-semibold uppercase tracking-[0.3em] text-slate-400">
                Market activity
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Recently viewed properties
              </p>
              {loading ? (
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-xl border border-slate-800 bg-slate-900/80"
                    />
                  ))}
                </div>
              ) : viewed.length === 0 ? (
                <p className="mt-3 py-2 text-xs text-slate-500">
                  No recently viewed properties.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {viewed.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/properties/${p.id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 hover:border-emerald-500/40"
                    >
                      <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-slate-100">
                          {p.address ?? p.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ${p.price?.toLocaleString() ?? '—'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
