'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type SellerVerificationStatus = 'loading' | 'approved' | 'unverified';

async function ensurePropertyPhotosBucket() {
  const { error: getErr } = await supabase.storage.getBucket('property-photos');
  if (getErr) {
    await supabase.storage.createBucket('property-photos', { public: true });
  }
}

const PROPERTY_TYPES = [
  { value: 'SINGLE_FAMILY', label: 'House' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'TOWNHOUSE', label: 'Townhome' },
  { value: 'MULTI_FAMILY', label: 'Multi-family' },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function SellListPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [sellerVerification, setSellerVerification] = useState<SellerVerificationStatus>('loading');

  useEffect(() => {
    ensurePropertyPhotosBucket();
  }, []);

  useEffect(() => {
    const checkSellerVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSellerVerification('unverified');
        return;
      }
      const { data: submissions } = await supabase
        .from('kyc_submissions')
        .select('id, status, submission_type')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);
      const sellerApproved = submissions?.some((s) => (s as { submission_type?: string }).submission_type === 'seller' && s.status === 'APPROVED');
      setSellerVerification(sellerApproved ? 'approved' : 'unverified');
    };
    checkSellerVerification();
  }, []);

  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'SINGLE_FAMILY',
    bedrooms: 3,
    bathrooms: 2,
    sqft: '',
    yearBuilt: '',
    lotSize: '',
    price: '',
    description: '',
    highlights: [] as string[],
    highlightInput: '',
    photoUrls: [] as string[],
    agreed: false,
  });

  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('property-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || form.photoUrls.length >= 10) return;
    for (let i = 0; i < Math.min(files.length, 10 - form.photoUrls.length); i++) {
      try {
        const url = await uploadPhoto(files[i]);
        setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, url] }));
      } catch {
        alert('Upload failed');
      }
    }
  };

  const removePhoto = (index: number) => {
    setForm((f) => ({ ...f, photoUrls: f.photoUrls.filter((_, i) => i !== index) }));
  };

  const addHighlight = () => {
    const t = form.highlightInput.trim();
    if (!t || form.highlights.length >= 5) return;
    setForm((f) => ({ ...f, highlights: [...f.highlights, t], highlightInput: '' }));
  };

  const removeHighlight = (index: number) => {
    setForm((f) => ({ ...f, highlights: f.highlights.filter((_, i) => i !== index) }));
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[Sell] Submit clicked, agreedToTerms:', form.agreed);
    console.log('[Sell] Form data:', { ...form, photoUrls: form.photoUrls.length, highlights: form.highlights.length });
    console.log('[Sell] User:', user?.id);
    if (!user || !form.agreed) return;
    if (form.description.length < 50) {
      setSubmitError('Description must be at least 50 characters.');
      return;
    }
    setSubmitting(true);
    const priceNum = form.price ? parseFloat(form.price.replace(/,/g, '')) : null;
    const sqftNum = form.sqft ? parseInt(form.sqft, 10) : null;
    const propertyPayload = {
      address: form.address,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode || null,
      propertyType: form.propertyType,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      sqft: sqftNum,
      price: priceNum,
      description: form.description.trim(),
      status: 'ACTIVE',
      user_id: user.id,
    };
    console.log('[Sell] Properties insert payload:', propertyPayload);
    const { data: prop, error: propError } = await supabase
      .from('properties')
      .insert(propertyPayload)
      .select('id')
      .single();

    if (propError || !prop) {
      setSubmitting(false);
      const msg = propError?.message ?? 'Failed to create listing';
      setSubmitError(msg);
      return;
    }
    console.log('[Sell] Property created:', (prop as { id: string }).id);

    const { error: listError } = await supabase.from('seller_listings').insert({
      user_id: user.id,
      property_id: (prop as { id: string }).id,
      status: 'active',
    });
    setSubmitting(false);
    if (listError) {
      setSubmitError(listError.message ?? 'Failed to save listing');
      return;
    }
    router.push(`/sell/success?propertyId=${(prop as { id: string }).id}`);
  };

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Basics' },
    { n: 2, label: 'Details' },
    { n: 3, label: 'Price & description' },
    { n: 4, label: 'Photos' },
    { n: 5, label: 'Review' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href="/sell" className="mb-6 inline-block text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">← Sell</Link>
        {sellerVerification === 'unverified' && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Verify your identity to publish your listing.</p>
            <p className="mt-1 text-xs">Complete seller verification to list your home on the marketplace.</p>
            <Link href="/sell/verify" className="mt-3 inline-block font-semibold text-amber-700 hover:text-amber-900">Verify now →</Link>
          </div>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1A1A1A]">List your home</h1>
        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <button key={n} type="button" onClick={() => setStep(n)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${step === n ? 'bg-[#1B4332] text-white' : 'bg-[#F4F3F0] text-[#4A4A4A]'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Property basics</h2>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              <div className="grid grid-cols-3 gap-2">
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="State" className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
                <input value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))} placeholder="ZIP" className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Property type</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, propertyType: t.value }))} className={`rounded-xl border px-3 py-2 text-sm ${form.propertyType === t.value ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.state} className="w-full rounded-xl bg-[#1B4332] py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Property details</h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Bedrooms (1–10)</label>
                <div className="flex gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, bedrooms: n }))} className={`h-10 w-10 rounded-xl border text-sm font-medium ${form.bedrooms === n ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Bathrooms (1–10)</label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, bathrooms: n }))} className={`h-10 w-10 rounded-xl border text-sm font-medium ${form.bathrooms === n ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <input type="number" min={1} value={form.sqft} onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))} placeholder="Square footage" className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              <input type="number" min={1800} max={new Date().getFullYear() + 1} value={form.yearBuilt} onChange={(e) => setForm((f) => ({ ...f, yearBuilt: e.target.value }))} placeholder="Year built" className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              <input type="number" min={0} value={form.lotSize} onChange={(e) => setForm((f) => ({ ...f, lotSize: e.target.value }))} placeholder="Lot size (sqft, optional)" className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!form.sqft} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Pricing & description</h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Asking price</label>
                <input type="text" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') }))} placeholder="500,000" className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Description (min 50 characters)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe your home..." className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
                <p className="mt-1 text-[11px] text-[#1A1A1A]0">{form.description.length} characters</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Highlights (up to 5)</label>
                <div className="flex gap-2">
                  <input value={form.highlightInput} onChange={(e) => setForm((f) => ({ ...f, highlightInput: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())} placeholder="Add a highlight" className="h-10 flex-1 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#888888]" />
                  <button type="button" onClick={addHighlight} disabled={form.highlights.length >= 5 || !form.highlightInput.trim()} className="rounded-xl border border-[#E8E6E1] px-3 text-sm font-medium text-[#4A4A4A] disabled:opacity-50">Add</button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.highlights.map((h, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-[#F4F3F0] px-3 py-1.5 text-sm text-[#1A1A1A]">
                      <span className="text-[#1A1A1A]">• {h}</span>
                      <button type="button" onClick={() => removeHighlight(i)} className="text-rose-400 text-xs">Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(4)} disabled={!form.price || form.description.length < 50} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Photos (up to 10)</h2>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                {form.photoUrls.length}/10 photos — click to add
              </label>
              <div className="flex flex-wrap gap-2">
                {form.photoUrls.map((url, i) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-xs text-white">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(5)} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white hover:bg-[#2D5A47]">Continue</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Review & submit</h2>
              <div className="rounded-xl border border-[#E8E6E1] bg-white/50 p-4 text-sm text-[#1A1A1A] space-y-1">
                <p className="font-medium text-[#1A1A1A]">{form.address}, {form.city}, {form.state} {form.zipCode}</p>
                <p>${form.price} • {form.bedrooms} bd, {form.bathrooms} ba, {form.sqft} sqft</p>
                <p className="text-xs text-[#4A4A4A] line-clamp-2">{form.description}</p>
                <p className="text-xs text-[#1A1A1A]0">{form.photoUrls.length} photos</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.agreed} onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-[#E8E6E1] text-[#1B4332]" />
                <span className="text-xs text-[#4A4A4A]">I agree to the listing terms.</span>
              </label>
              {submitError && (
                <div className="rounded-xl border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                  {submitError}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-sm font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={!form.agreed || submitting || sellerVerification !== 'approved'} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : sellerVerification === 'approved' ? 'Submit listing' : 'Verify to publish'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
