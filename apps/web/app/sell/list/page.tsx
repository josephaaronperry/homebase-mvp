'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

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

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.agreed) return;
    if (form.description.length < 50) {
      alert('Description must be at least 50 characters.');
      return;
    }
    setSubmitting(true);
    const priceNum = form.price ? parseFloat(form.price.replace(/,/g, '')) : null;
    const sqftNum = form.sqft ? parseInt(form.sqft, 10) : null;
    const yearNum = form.yearBuilt ? parseInt(form.yearBuilt, 10) : null;
    const lotNum = form.lotSize ? parseFloat(form.lotSize) : null;
    const { data: prop, error: propError } = await supabase
      .from('properties')
      .insert({
        user_id: user.id,
        title: form.address || 'New listing',
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zipCode || null,
        property_type: form.propertyType,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        sqft: sqftNum,
        year_built: yearNum || null,
        lot_size: lotNum || null,
        price: priceNum,
        description: form.description.trim(),
        features: form.highlights.length ? { highlights: form.highlights } : {},
        image_url: form.photoUrls[0] || null,
        images: form.photoUrls,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (propError || !prop) {
      setSubmitting(false);
      alert(propError?.message ?? 'Failed to create listing');
      return;
    }

    const { error: listError } = await supabase.from('seller_listings').insert({
      user_id: user.id,
      property_id: (prop as { id: string }).id,
      status: 'active',
    });
    setSubmitting(false);
    if (listError) {
      alert(listError.message ?? 'Failed to save listing');
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href="/sell" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">← Sell</Link>
        <h1 className="text-2xl font-semibold text-slate-50">List your home</h1>
        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <button key={n} type="button" onClick={() => setStep(n)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${step === n ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Property basics</h2>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <div className="grid grid-cols-3 gap-2">
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="State" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))} placeholder="ZIP" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Property type</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, propertyType: t.value }))} className={`rounded-xl border px-3 py-2 text-sm ${form.propertyType === t.value ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.state} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Property details</h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Bedrooms (1–10)</label>
                <div className="flex gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, bedrooms: n }))} className={`h-10 w-10 rounded-xl border text-sm font-medium ${form.bedrooms === n ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Bathrooms (1–10)</label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, bathrooms: n }))} className={`h-10 w-10 rounded-xl border text-sm font-medium ${form.bathrooms === n ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 text-slate-300'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <input type="number" min={1} value={form.sqft} onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))} placeholder="Square footage" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <input type="number" min={1800} max={new Date().getFullYear() + 1} value={form.yearBuilt} onChange={(e) => setForm((f) => ({ ...f, yearBuilt: e.target.value }))} placeholder="Year built" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <input type="number" min={0} value={form.lotSize} onChange={(e) => setForm((f) => ({ ...f, lotSize: e.target.value }))} placeholder="Lot size (sqft, optional)" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!form.sqft} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Pricing & description</h2>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Asking price</label>
                <input type="text" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') }))} placeholder="500,000" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Description (min 50 characters)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe your home..." className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500" />
                <p className="mt-1 text-[11px] text-slate-500">{form.description.length} characters</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Highlights (up to 5)</label>
                <div className="flex gap-2">
                  <input value={form.highlightInput} onChange={(e) => setForm((f) => ({ ...f, highlightInput: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())} placeholder="Add a highlight" className="h-10 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                  <button type="button" onClick={addHighlight} disabled={form.highlights.length >= 5 || !form.highlightInput.trim()} className="rounded-xl border border-slate-700 px-3 text-sm font-medium text-slate-300 disabled:opacity-50">Add</button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.highlights.map((h, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-slate-900/60 px-3 py-1.5 text-sm">
                      <span className="text-slate-200">• {h}</span>
                      <button type="button" onClick={() => removeHighlight(i)} className="text-rose-400 text-xs">Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={() => setStep(4)} disabled={!form.price || form.description.length < 50} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Photos (up to 10)</h2>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
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
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={() => setStep(5)} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Continue</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Review & submit</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-200 space-y-1">
                <p className="font-medium text-slate-50">{form.address}, {form.city}, {form.state} {form.zipCode}</p>
                <p>${form.price} • {form.bedrooms} bd, {form.bathrooms} ba, {form.sqft} sqft</p>
                <p className="text-xs text-slate-400 line-clamp-2">{form.description}</p>
                <p className="text-xs text-slate-500">{form.photoUrls.length} photos</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.agreed} onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500" />
                <span className="text-xs text-slate-300">I agree to the listing terms.</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={handleSubmit} disabled={!form.agreed || submitting} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit listing'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
