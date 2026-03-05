// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase/client';
import { getStageLabel } from '@/lib/pipeline-stages';

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

type DealPreview = {
  id: string;
  property_id: string;
  agreed_price: number | null;
  status: string;
  property_address: string | null;
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
  const [deals, setDeals] = useState<DealPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [preApprovalStatus, setPreApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setError(null);
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
        dealsRes,
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('saved_properties').select('*', { count: 'exact', head: true }).eq('userId', user.id),
        supabase
          .from('saved_properties')
          .select('id, propertyId')
          .eq('userId', user.id)
          .order('savedAt', { ascending: false })
          .limit(6),
        supabase
          .from('showings')
          .select('id, propertyId, requestedAt, confirmedAt, tour_type, status')
          .eq('userId', user.id)
          .gte('requestedAt', new Date().toISOString())
          .neq('status', 'CANCELLED')
          .order('requestedAt', { ascending: true })
          .limit(3),
        supabase
          .from('offers')
          .select('id, offerPrice, status, property_id')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
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
        supabase.from('deals').select('id, property_id, agreed_price, status').eq('buyer_id', user.id),
      ]);

      if (savedRes.error || showingsRes.error || offersRes.error || pipelinesRes.error) {
        setError(savedRes.error?.message ?? showingsRes.error?.message ?? offersRes.error?.message ?? pipelinesRes.error?.message ?? 'Failed to load dashboard');
        setLoading(false);
        return;
      }
      setStats({
        total: totalProperties ?? 0,
        saved: savedCount ?? 0,
      });
      const savedRows = (savedRes.data ?? []) as { id: string; propertyId: string }[];
      if (savedRows.length > 0) {
        const propertyIds = savedRows.map((r) => r.propertyId);
        const { data: props } = await supabase
          .from('properties')
          .select('id, price, address, city, state, bedrooms, bathrooms, sqft, image_url, title')
          .in('id', propertyIds);
        const propMap = new Map((props ?? []).map((p: { id: string; price: number | null; address: string | null; city: string | null; state: string | null; bedrooms: number | null; bathrooms: number | null; sqft: number | null; image_url: string | null; title: string | null }) => [p.id, p]));
        setSaved(
          savedRows.map((r) => {
            const p = propMap.get(r.propertyId) as { price: number | null; address: string | null; city: string | null; state: string | null; bedrooms: number | null; bathrooms: number | null; sqft: number | null; image_url: string | null; title: string | null } | undefined;
            return {
              id: r.id,
              property_id: r.propertyId,
              price: p?.price ?? null,
              address: p?.address ?? null,
              city: p?.city ?? null,
              state: p?.state ?? null,
              bedrooms: p?.bedrooms ?? null,
              bathrooms: p?.bathrooms ?? null,
              sqft: p?.sqft ?? null,
              image_url: p?.image_url ?? null,
              title: p?.title ?? null,
            };
          })
        );
      } else {
        setSaved([]);
      }
      const showingRows = (showingsRes.data ?? []) as { id: string; propertyId: string; requestedAt: string | null; confirmedAt: string | null; tour_type: string | null; status: string }[];
      if (showingRows.length > 0) {
        const spIds = [...new Set(showingRows.map((s) => s.propertyId))];
        const { data: showProps } = await supabase.from('properties').select('id, address, city, state').in('id', spIds);
        const showPropMap = new Map((showProps ?? []).map((p: { id: string; address: string | null; city: string | null; state: string | null }) => [p.id, p]));
        setShowings(
          showingRows.map((s) => ({
            id: s.id,
            property_address: (showPropMap.get(s.propertyId) as { address: string | null } | undefined)?.address ?? null,
            property_city: (showPropMap.get(s.propertyId) as { city: string | null } | undefined)?.city ?? null,
            property_state: (showPropMap.get(s.propertyId) as { state: string | null } | undefined)?.state ?? null,
            scheduled_at: s.confirmedAt ?? s.requestedAt,
            tour_type: s.tour_type,
          }))
        );
      } else {
        setShowings([]);
      }
      const offerRows = (offersRes.data ?? []) as { id: string; offerPrice: number | null; status: string | null; property_id: string | null }[];
      if (offerRows.length > 0) {
        const opIds = [...new Set(offerRows.map((o) => o.property_id).filter(Boolean))] as string[];
        const { data: offerProps } = opIds.length > 0 ? await supabase.from('properties').select('id, address, city, state').in('id', opIds) : { data: [] };
        const offerPropMap = new Map((offerProps ?? []).map((p: { id: string; address: string | null; city: string | null; state: string | null }) => [p.id, p]));
        const offersData: OfferPreview[] = offerRows.map((o) => {
          const p = o.property_id ? offerPropMap.get(o.property_id) as { address: string | null; city: string | null; state: string | null } | undefined : undefined;
          return {
            id: o.id,
            price: o.offerPrice,
            status: o.status,
            property_address: p?.address ?? null,
            property_city: p?.city ?? null,
            property_state: p?.state ?? null,
          };
        });
        setOffers(offersData);
        const accepted = offersData.find((o) => o.status === 'ACCEPTED') ?? null;
        setAcceptedOffer(accepted);
      } else {
        setOffers([]);
        setAcceptedOffer(null);
      }
      const kyc = (kycRes.data as { status?: string } | null)?.status ?? null;
      setKycStatus(kyc);
      setIsVerified(kyc === 'APPROVED');

      const { data: userProfile } = await supabase.from('users').select('preApprovalStatus').eq('id', user.id).maybeSingle();
      setPreApprovalStatus((userProfile as { preApprovalStatus?: string } | null)?.preApprovalStatus ?? 'NONE');

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
      const dealRows = (dealsRes.data ?? []) as { id: string; property_id: string; agreed_price: number | null; status: string }[];
      const allPropertyIds = [...new Set([...pipelineRows.map((p) => p.property_id), ...dealRows.map((d) => d.property_id)])].filter(Boolean);
      if (pipelineRows.length > 0 || dealRows.length > 0) {
        const { data: props } = await supabase
          .from('properties')
          .select('id, address, city, state, price')
          .in('id', allPropertyIds);
        const propMap = new Map((props ?? []).map((p: { id: string; address: string | null; city: string | null; state: string | null; price: number | null }) => [p.id, p]));
        if (pipelineRows.length > 0) {
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
        if (dealRows.length > 0) {
          setDeals(
            dealRows.map((row) => ({
              id: row.id,
              property_id: row.property_id,
              agreed_price: row.agreed_price,
              status: row.status,
              property_address: (propMap.get(row.property_id) as { address: string | null } | undefined)?.address ?? null,
            }))
          );
        }
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
    if (s === 'ACCEPTED') return 'bg-[#1B4332]/15 text-[#1B4332]';
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'bg-amber-500/15 text-amber-700';
    if (s === 'REJECTED') return 'bg-rose-500/15 text-rose-700';
    return 'bg-[#F4F3F0] text-[#4A4A4A]';
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-[#E8E6E1] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:border-[#1B4332]"
          >
            HomeBase
          </Link>
          <div className="flex items-center gap-3 text-xs text-[#4A4A4A]">
            {email && (
              <span className="hidden max-w-[10rem] truncate sm:inline-block">
                {email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-full border border-[#E8E6E1] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A4A4A] hover:border-[#1B4332]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Welcome header with verification badge */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1A1A1A]">
              Welcome back, {userName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B4332]/15 px-3 py-1 text-xs font-semibold text-[#1B4332]">
                  ✓ Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F3F0] px-3 py-1 text-xs font-medium text-[#4A4A4A]">
                  Identity not verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification status banner */}
        {isVerified && (
          <div className="mb-6 rounded-2xl border border-[#1B4332]/30 bg-[#1B4332]/10 px-5 py-4">
            <p className="text-sm font-medium text-[#1B4332]">
              Identity verified — you can make offers.
            </p>
          </div>
        )}
        {kycStatus === 'PENDING' || kycStatus === 'UNDER_REVIEW' ? (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-800">
              Your verification is under review — usually within 24 hours.
            </p>
          </div>
        ) : !isVerified && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-amber-800">
                Complete identity verification to unlock making offers on properties.
              </p>
              <Link
                href="/verify"
                className="flex-shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Verify now
              </Link>
            </div>
          </div>
        )}

        {/* Pre-approval status banner */}
        {(preApprovalStatus === 'NONE' || preApprovalStatus === 'PENDING') && (
          <div className="mb-6 rounded-2xl border border-[#E8E6E1] bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Pre-approval status</p>
                <p className="mt-0.5 text-xs text-[#4A4A4A]">
                  {preApprovalStatus === 'PENDING' ? 'Your pre-approval is under review. We\'ll notify you within 1 business day.' : 'Upload a pre-approval letter or proof of funds to submit offers.'}
                </p>
              </div>
              <Link
                href="/pre-approval"
                className="flex-shrink-0 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47]"
              >
                {preApprovalStatus === 'PENDING' ? 'View status' : 'Get pre-approved'}
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        {/* Empty state: getting started */}
        {!loading && stats.saved === 0 && showings.length === 0 && offers.length === 0 && !acceptedOffer && (
          <div className="mb-8 rounded-3xl border border-[#E8E6E1] bg-white p-8 shadow-sm">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">Getting started</h2>
            <p className="mt-1 text-sm text-[#4A4A4A]">Follow these steps to find and secure your next home.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm hover:border-[#1B4332]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] font-[family-name:var(--font-body)] text-sm font-semibold text-white">1</span>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Browse homes</div>
                  <div className="text-xs text-[#4A4A4A]">Explore listings in your market.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm hover:border-[#1B4332]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] font-[family-name:var(--font-body)] text-sm font-semibold text-white">2</span>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Save favorites</div>
                  <div className="text-xs text-[#4A4A4A]">Heart homes to revisit later.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm hover:border-[#1B4332]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] font-[family-name:var(--font-body)] text-sm font-semibold text-white">3</span>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Schedule a tour</div>
                  <div className="text-xs text-[#4A4A4A]">Book in-person or virtual showings.</div>
                </div>
              </Link>
              <Link href="/verify" className="flex items-start gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm hover:border-[#1B4332]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] font-[family-name:var(--font-body)] text-sm font-semibold text-white">4</span>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Get verified</div>
                  <div className="text-xs text-[#4A4A4A]">Complete identity verification.</div>
                </div>
              </Link>
              <Link href="/properties" className="flex items-start gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 shadow-sm hover:border-[#1B4332]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B4332] font-[family-name:var(--font-body)] text-sm font-semibold text-white">5</span>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Make an offer</div>
                  <div className="text-xs text-[#4A4A4A]">Submit offers from any property.</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Active transaction card */}
        {acceptedOffer && (
          <Link
            href={`/transaction/${acceptedOffer.id}`}
            className="mb-6 flex items-center justify-between rounded-2xl border border-[#1B4332]/30 bg-[#1B4332]/10 px-5 py-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
                Active transaction
              </p>
              <p className="mt-1 font-medium text-[#1A1A1A]">
                {acceptedOffer.property_address}
              </p>
              <p className="text-sm text-[#4A4A4A]">
                Offer accepted • Track progress
              </p>
            </div>
            <span className="rounded-full bg-[#1B4332]/20 px-3 py-1 text-xs font-semibold text-[#1B4332]">
              {acceptedOffer.status}
            </span>
          </Link>
        )}

        {/* Active deals */}
        {deals.length > 0 && (
          <div className="mb-6 rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B4332]">
              Active deals
            </p>
            <p className="mt-1 text-sm text-[#4A4A4A]">
              Deals where your offer was accepted — track progress to closing.
            </p>
            <div className="mt-4 space-y-2">
              {deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/dashboard/buying/${deal.property_id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3 hover:border-[#1B4332]"
                >
                  <div>
                    <p className="font-medium text-[#1A1A1A]">
                      {deal.property_address ?? 'Property'}
                    </p>
                    <p className="text-xs text-[#4A4A4A]">
                      {deal.agreed_price != null ? `$${deal.agreed_price.toLocaleString()}` : '—'} · {deal.status}
                    </p>
                  </div>
                  <span className="text-[#888888]">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active transactions (buying pipelines) */}
        {pipelines.length > 0 && (
          <div className="mb-6 rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B4332]">
              Active transactions
            </p>
            <p className="mt-1 text-sm text-[#4A4A4A]">
              Properties you’re pursuing — track each deal in the buying pipeline.
            </p>
            <div className="mt-4 space-y-2">
              {pipelines.map((pipe) => (
                <Link
                  key={pipe.id}
                  href={`/dashboard/buying/${pipe.property_id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3 hover:border-[#1B4332]"
                >
                  <div>
                    <p className="font-medium text-[#1A1A1A]">
                      {pipe.property_address ?? 'Property'}
                    </p>
                    <p className="text-xs text-[#4A4A4A]">
                      {pipe.property_city}, {pipe.property_state}
                      {pipe.property_price != null && ` • $${pipe.property_price.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#E8E6E1] px-2.5 py-1 text-[11px] font-semibold uppercase text-[#4A4A4A]">
                      {getStageLabel(pipe.current_stage)}
                    </span>
                    <span className="text-[#888888]">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B4332]">
                Overview
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">
                Your buyer command center
              </h2>
              <p className="mt-2 text-sm text-[#4A4A4A]">
                Track saved homes, upcoming showings, and stay on top of your next move.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm min-[390px]:grid-cols-2 max-[389px]:grid-cols-1">
                <div className="rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">
                    Saved homes
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#1A1A1A]">
                    {loading ? '—' : stats.saved}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">
                    Total listings
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#1A1A1A]">
                    {loading ? '—' : stats.total}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/properties"
                className="flex items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3 shadow-sm hover:border-[#1B4332]"
              >
                <span className="text-lg">🔍</span>
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    Browse listings
                  </div>
                  <div className="text-xs text-[#4A4A4A]">
                    Explore homes across your target markets.
                  </div>
                </div>
              </Link>
              <Link
                href="/saved"
                className="flex items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3 shadow-sm hover:border-[#1B4332]"
              >
                <span className="text-lg">❤️</span>
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A]">
                    Saved homes
                  </div>
                  <div className="text-xs text-[#4A4A4A]">
                    Quickly revisit homes you love.
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <aside className="space-y-3 rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B4332]">
                Upcoming showings
              </p>
              <Link
                href="/showings"
                className="text-[11px] font-semibold text-[#52B788] hover:text-[#1B4332]"
              >
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0]"
                  />
                ))}
              </div>
            ) : showings.length === 0 ? (
              <p className="py-4 text-xs text-[#4A4A4A]">
                No upcoming showings. Schedule a tour from any property page.
              </p>
            ) : (
              <div className="space-y-2">
                {showings.map((s) => (
                  <Link
                    key={s.id}
                    href="/showings"
                    className="flex items-center justify-between rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-3 py-2.5 hover:border-[#1B4332]"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#1A1A1A]">
                        {s.property_address}
                      </div>
                      <div className="text-[11px] text-[#4A4A4A]">
                        {s.property_city}, {s.property_state}
                      </div>
                      {s.tour_type && (
                        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#888888]">
                          {s.tour_type === 'VIRTUAL' ? 'Virtual' : 'In-person'}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-[#4A4A4A]">
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
          <div className="rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs">
              <p className="font-semibold uppercase tracking-[0.3em] text-[#4A4A4A]">
                Saved homes
              </p>
              <Link
                href="/saved"
                className="text-[11px] font-semibold text-[#52B788] hover:text-[#1B4332]"
              >
                View all ({stats.saved}) →
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0]"
                  />
                ))}
              </div>
            ) : saved.length === 0 ? (
              <p className="py-6 text-xs text-[#4A4A4A]">
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
                    image_url={s.image_url}
                    href={`/properties/${s.property_id}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* My offers */}
            <div className="rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold uppercase tracking-[0.3em] text-[#4A4A4A]">
                  My offers
                </p>
                <Link
                  href="/dashboard/offers"
                  className="text-[11px] font-semibold text-[#52B788] hover:text-[#1B4332]"
                >
                  View all →
                </Link>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl border border-[#E8E6E1] bg-[#F4F3F0]"
                    />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <p className="py-4 text-xs text-[#4A4A4A]">
                  No offers yet. Make an offer from any property page.
                </p>
              ) : (
                <div className="space-y-2">
                  {offers.slice(0, 3).map((o) => (
                    <Link
                      key={o.id}
                      href={`/transaction/${o.id}`}
                      className="flex items-center justify-between rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] px-3 py-2 hover:border-[#1B4332]"
                    >
                      <div>
                        <div className="font-[family-name:var(--font-mono)] text-xs font-medium text-[#1A1A1A]">
                          ${o.price?.toLocaleString() ?? '—'}
                        </div>
                        <div className="text-[11px] text-[#4A4A4A]">
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
            <div className="rounded-3xl border border-[#E8E6E1] bg-white p-5 shadow-sm">
              <p className="font-semibold uppercase tracking-[0.3em] text-[#4A4A4A]">
                Market activity
              </p>
              <p className="mt-1 text-xs text-[#4A4A4A]">
                Recently viewed properties
              </p>
              {loading ? (
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-xl border border-[#E8E6E1] bg-[#F4F3F0]"
                    />
                  ))}
                </div>
              ) : viewed.length === 0 ? (
                <p className="mt-3 py-2 text-xs text-[#4A4A4A]">
                  No recently viewed properties.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {viewed.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/properties/${p.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] px-3 py-2 hover:border-[#1B4332]"
                    >
                      <div className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#E8E6E1]">
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
                        <div className="truncate text-xs font-medium text-[#1A1A1A]">
                          {p.address ?? p.title}
                        </div>
                        <div className="font-[family-name:var(--font-mono)] text-[11px] text-[#4A4A4A]">
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
