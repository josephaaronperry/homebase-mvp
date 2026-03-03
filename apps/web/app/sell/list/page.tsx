'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3 | 4;

export default function SellListPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    description: '',
    property_type: 'house',
    photos: [] as string[],
    agreed: false,
  });

  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `listings/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('property-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || form.photos.length >= 10) return;
    for (let i = 0; i < Math.min(files.length, 10 - form.photos.length); i++) {
      try {
        const url = await uploadPhoto(files[i]);
        setForm((f) => ({ ...f, photos: [...f.photos, url] }));
      } catch {
        alert('Upload failed');
      }
    }
  };

  const removePhoto = (index: number) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.agreed) return;
    setSubmitting(true);
    const { error } = await supabase.from('properties').insert({
      title: form.address || 'New listing',
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip || null,
      price: form.price ? parseFloat(form.price) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
      bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
      sqft: form.sqft ? parseInt(form.sqft, 10) : null,
      description: form.description || null,
      image_url: form.photos[0] || null,
      images: form.photos,
      property_type: form.property_type,
      status: 'PENDING_REVIEW',
    });
    setSubmitting(false);
    if (error) {
      alert(error.message ?? 'Failed to create listing');
      return;
    }
    router.push('/sell/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href="/sell" className="mb-6 inline-block text-xs font-medium text-slate-400 hover:text-emerald-400">← Sell</Link>
        <h1 className="text-2xl font-semibold text-slate-50">List your home</h1>
        <div className="mt-6 flex gap-2">
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <button key={s} type="button" onClick={() => setStep(s)} className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${step === s ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/60 text-slate-500'}`}>Step {s}</button>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Address</h2>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <div className="grid grid-cols-3 gap-2">
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="State" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} placeholder="ZIP" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!form.address || !form.city || !form.state} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Price & details</h2>
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Asking price" className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} placeholder="Beds" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input type="number" step="0.5" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} placeholder="Baths" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
                <input type="number" value={form.sqft} onChange={(e) => setForm((f) => ({ ...f, sqft: e.target.value }))} placeholder="Sqft" className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 placeholder:text-slate-500" />
              </div>
              <select value={form.property_type} onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value }))} className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50">
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhome">Townhome</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Continue</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Description & photos</h2>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe your home..." className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500" />
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                {form.photos.length}/10 photos
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.photos.map((url, i) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-xs text-white">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Continue</button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Review & submit</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-200">
                <p>{form.address}, {form.city}, {form.state}</p>
                <p className="mt-1">${form.price} • {form.bedrooms} bd, {form.bathrooms} ba, {form.sqft} sqft • {form.photos.length} photos</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.agreed} onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500" />
                <span className="text-xs text-slate-300">I agree to the listing terms.</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-semibold text-slate-300">Back</button>
                <button type="button" onClick={handleSubmit} disabled={!form.agreed || submitting} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit listing'}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
