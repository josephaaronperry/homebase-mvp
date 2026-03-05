'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertySidebar } from '@/components/PropertySidebar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useToast } from '@/components/ToastProvider';

const supabase = getSupabaseClient();
const GUEST_SAVED_KEY = 'homebase_saved';

export type PropertyDetail = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode?: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  property_type: string | null;
  status: string | null;
  hoa_fee: number | null;
  garage: boolean | number | string | null;
};

type SimilarProperty = {
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

type Props = {
  property: PropertyDetail;
  similar: SimilarProperty[];
  propertyUrl: string;
};

const DESCRIPTION_TRUNCATE = 300;

export function PropertyDetailContent({ property, similar, propertyUrl }: Props) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tourDate, setTourDate] = useState<string | null>(null);
  const [tourTime, setTourTime] = useState<string | null>(null);

  useEffect(() => {
    const loadSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try {
          const raw = localStorage.getItem(GUEST_SAVED_KEY);
          const arr = raw ? JSON.parse(raw) : [];
          setSaved(arr.includes(property.id));
        } catch {}
        return;
      }
      const { data } = await supabase.from('saved_properties').select('propertyId').eq('userId', user.id).eq('propertyId', property.id).maybeSingle();
      setSaved(!!data);
    };
    loadSaved();
  }, [property.id]);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (!user) {
      try {
        const raw = localStorage.getItem(GUEST_SAVED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        const set = new Set(arr);
        if (nextSaved) set.add(property.id); else set.delete(property.id);
        localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify([...set]));
      } catch {}
      toast(nextSaved ? 'Saved to favorites' : 'Removed from saved homes');
      return;
    }
    if (nextSaved) {
      await supabase.from('saved_properties').insert({ userId: user.id, propertyId: property.id });
      toast('Saved to favorites');
    } else {
      await supabase.from('saved_properties').delete().eq('userId', user.id).eq('propertyId', property.id);
      toast('Removed from saved homes');
    }
  };

  const imageList: string[] = [];
  if (property.image_url) imageList.push(property.image_url);
  if (Array.isArray(property.images) && property.images.length) {
    property.images.forEach((u) => {
      if (u && !imageList.includes(u)) imageList.push(u);
    });
  }
  const mainImage = imageList[0] ?? null;
  const hasMultipleImages = imageList.length > 1;

  const fmtPrice = property.price ? `$${property.price.toLocaleString()}` : 'Price on request';
  const fullAddress = [property.address, property.city, property.state].filter(Boolean).join(', ');
  const zip = (property as { zipCode?: string; zip_code?: string }).zipCode ?? (property as { zip_code?: string }).zip_code;
  const cityStateZip = [property.city, property.state, zip].filter(Boolean).join(' ');

  const agentCost = property.price != null ? Math.round(property.price * 0.03) : 0;
  const homebaseFee = 4000;
  const youSave = Math.max(0, agentCost - homebaseFee);

  const estMonthly = (() => {
    if (property.price == null || property.price <= 0) return null;
    const principal = property.price * 0.8;
    const r = 0.068 / 12;
    const n = 30 * 12;
    return Math.round((principal * r) / (1 - Math.pow(1 + r, -n)));
  })();

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  const desc = property.description ?? '';
  const truncated = desc.length > DESCRIPTION_TRUNCATE ? desc.slice(0, DESCRIPTION_TRUNCATE) + '…' : desc;
  const showExpand = desc.length > DESCRIPTION_TRUNCATE;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-col gap-2 border-b border-[#E8E6E1] bg-[#FAFAF8]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Properties', href: '/properties' },
              { label: fullAddress || String(property.id) },
            ]}
          />
          <Link href="/properties" className="text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">
            ← Back to results
          </Link>
        </div>

        {/* Photo section — 55vh */}
        <section className="relative w-full overflow-hidden rounded-t-2xl bg-[#F4F3F0]">
          <div className="relative h-[55vh] w-full">
            {mainImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mainImage}
                alt={property.title ?? fullAddress ?? 'Property'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">🏡</div>
            )}
            {hasMultipleImages && (
              <button
                type="button"
                onClick={() => { setLightboxOpen(true); setLightboxIndex(0); }}
                className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur"
              >
                1 / {imageList.length} ▸
              </button>
            )}
          </div>
        </section>

        {/* Lightbox */}
        {lightboxOpen && hasMultipleImages && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              type="button"
              onClick={() => setLightboxIndex((i) => (i - 1 + imageList.length) % imageList.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Previous"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageList[lightboxIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxIndex((i) => (i + 1) % imageList.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Next"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {lightboxIndex + 1} / {imageList.length}
            </span>
          </div>
        )}

        {/* Two-column: 65% left, 35% right */}
        <div className="grid gap-8 border border-t-0 border-[#E8E6E1] bg-white p-4 sm:p-6 md:grid-cols-[65%_1fr] md:p-8">
          <div className="min-w-0 space-y-6">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[36px] font-bold leading-tight text-[#1A1A1A]">
                {fmtPrice}
              </p>
              <p className="font-[family-name:var(--font-display)] mt-1 text-2xl text-[#1A1A1A]">
                {property.address ?? property.title ?? 'Property'}
              </p>
              <p className="mt-1 text-[#4A4A4A]">{cityStateZip}</p>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] px-4 py-3 text-sm">
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">🛏 {property.bedrooms ?? '—'} beds</span>
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">🛁 {property.bathrooms ?? '—'} baths</span>
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">📐 {property.sqft ? `${property.sqft.toLocaleString()} sqft` : '—'}</span>
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">🌳 {property.lot_size ? `${property.lot_size.toLocaleString()} sqft lot` : '—'}</span>
              <span className="flex items-center gap-1.5 text-[#1A1A1A]">📅 {property.year_built ?? '—'} built</span>
            </div>

            <hr className="border-[#E8E6E1]" />

            {/* About this home */}
            {desc && (
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">About this home</h2>
                <p className="mt-2 leading-relaxed text-[#4A4A4A]">
                  {showFullDescription ? desc : truncated}
                </p>
                {showExpand && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((v) => !v)}
                    className="mt-2 text-sm font-semibold text-[#52B788] hover:text-[#1B4332]"
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Property details accordion */}
            <div className="rounded-2xl border border-[#E8E6E1] bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]"
              >
                Property details
                <span className="text-[#4A4A4A]">{detailsOpen ? '▼' : '▶'}</span>
              </button>
              {detailsOpen && (
                <div className="border-t border-[#E8E6E1] px-4 py-3 text-sm text-[#4A4A4A]">
                  <p><strong className="text-[#1A1A1A]">Property type:</strong> {property.property_type?.replace(/_/g, ' ') ?? '—'}</p>
                  <p className="mt-1"><strong className="text-[#1A1A1A]">Parking:</strong> {property.garage != null && property.garage !== false ? (typeof property.garage === 'number' ? `${property.garage}+ garage` : 'Garage') : '—'}</p>
                  <p className="mt-1"><strong className="text-[#1A1A1A]">HOA fee:</strong> {property.hoa_fee != null && property.hoa_fee > 0 ? `$${property.hoa_fee}/mo` : 'None'}</p>
                  <p className="mt-1"><strong className="text-[#1A1A1A]">MLS #:</strong> —</p>
                  <p className="mt-1"><strong className="text-[#1A1A1A]">Status:</strong> {property.status ?? 'For sale'}</p>
                </div>
              )}
            </div>

            {/* What you save */}
            <div className="rounded-2xl bg-[#1B4332] px-5 py-4 text-white">
              <h3 className="font-[family-name:var(--font-display)] font-semibold">What you save</h3>
              <p className="mt-2 text-sm">
                Traditional agent cost: ${agentCost.toLocaleString()} | HomeBase: $4,000 flat | You save: ${youSave.toLocaleString()}
              </p>
            </div>

            {/* Schedule a tour — inline */}
            <div className="rounded-2xl border border-[#E8E6E1] bg-[#F4F3F0] p-4">
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-[#1A1A1A]">Schedule a tour</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {next7Days.map((d) => (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setTourDate(d.toISOString().slice(0, 10))}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${tourDate === d.toISOString().slice(0, 10) ? 'bg-[#1B4332] text-white' : 'bg-white text-[#1A1A1A] border border-[#E8E6E1]'}`}
                  >
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
              {tourDate && (
                <div className="mt-3">
                  <p className="text-xs text-[#4A4A4A]">Time</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {timeSlots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTourTime(t)}
                        className={`rounded-lg px-3 py-1.5 text-sm ${tourTime === t ? 'bg-[#1B4332] text-white' : 'bg-white border border-[#E8E6E1] text-[#1A1A1A]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#4A4A4A]">In-person or virtual — confirm after request.</p>
                </div>
              )}
            </div>

            {/* Similar homes */}
            {similar.length > 0 && (
              <section>
                <h2 className="font-[family-name:var(--font-display)] mb-3 text-lg font-semibold text-[#1A1A1A]">
                  More homes like this
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
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
                      image_url={p.image_url}
                      href={`/properties/${p.id}`}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="md:sticky md:top-24 md:self-start">
            <PropertySidebar
              propertyId={property.id}
              price={property.price}
              address={property.address}
              city={property.city}
              state={property.state}
              sellerName="Private seller"
              estMonthly={estMonthly}
              showSave
              saved={saved}
              onSaveClick={handleSaveClick}
              shareUrl={propertyUrl}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
