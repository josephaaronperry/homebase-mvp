'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Step = 1 | 2 | 3 | 4 | 5;

const LISTING_AGREEMENT_BULLETS = [
  'I am the legal owner or authorized to list this property.',
  'I will respond to offers and showings in good faith.',
  'Listing details are accurate to the best of my knowledge.',
  'I agree to the platform fee and terms of service.',
];

export default function SellVerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    ssn_last4: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    id_type: 'drivers_license' as 'drivers_license' | 'passport' | 'state_id',
    id_front_url: '',
    id_back_url: '',
    ownership_address: '',
    ownership_city: '',
    ownership_state: '',
    ownership_zip: '',
    ownership_doc_url: '',
    signature: '',
    agreedToTerms: false,
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?redirect=/sell/verify');
        return;
      }
      setLoading(false);
    };
    check();
  }, [router]);

  const handleFileUpload = useCallback(
    async (bucket: string, path: string, file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      const ext = file.name.split('.').pop() ?? 'pdf';
      const fullPath = `${user.id}/${path}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      return urlData.publicUrl;
    },
    []
  );

  const handleIdFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-documents', 'seller-id-front', file);
      setForm((f) => ({ ...f, id_front_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleIdBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-documents', 'seller-id-back', file);
      setForm((f) => ({ ...f, id_back_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleOwnershipDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await handleFileUpload('kyc-documents', 'ownership', file);
      setForm((f) => ({ ...f, ownership_doc_url: url }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const addressString = [form.street, form.city, form.state, form.zip].filter(Boolean).join(', ');
  const ownershipAddressString = [form.ownership_address, form.ownership_city, form.ownership_state, form.ownership_zip].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    if (!form.agreedToTerms || !form.signature.trim()) {
      alert('Please sign and agree to the listing agreement.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase.from('kyc_submissions').insert({
      user_id: user.id,
      status: 'PENDING',
      submission_type: 'seller',
      full_name: form.full_name,
      dob: form.dob || null,
      ssn_last4: form.ssn_last4 || null,
      address: addressString || null,
      phone: form.phone || null,
      id_type: form.id_type,
      id_front_url: form.id_front_url || null,
      id_back_url: form.id_back_url || null,
      ownership_doc_url: form.ownership_doc_url || null,
      ownership_property_address: ownershipAddressString || null,
      listing_agreement_signed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (error) {
      alert(error.message ?? 'Failed to submit');
      return;
    }
    setStep(5);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-[#1B4332]/40" />
      </div>
    );
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Identity' },
    { n: 2, label: 'Ownership' },
    { n: 3, label: 'Agreement' },
    { n: 4, label: 'Review' },
    { n: 5, label: 'Pending' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/sell" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">← Sell</Link>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">Seller verification</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">Verify your identity and property ownership to list your home.</p>

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
                step === n ? 'bg-[#1B4332] text-white' : step > n ? 'bg-[#E8E6E1] text-[#4A4A4A]' : 'bg-[#F4F3F0] text-[#888888]'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Personal information & ID</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Full legal name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Date of birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B4332]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Current address</label>
                <input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Street" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="City" />
                  <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="State" />
                  <input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="ZIP" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">SSN last 4</label>
                <input maxLength={4} value={form.ssn_last4} onChange={(e) => setForm((f) => ({ ...f, ssn_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="1234" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Government ID</label>
                <div className="flex gap-2 mb-2">
                  {(['drivers_license', 'passport', 'state_id'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, id_type: t }))} className={`flex-1 rounded-xl border px-2 py-1.5 text-[10px] font-semibold ${form.id_type === t ? 'border-[#1B4332] bg-[#1B4332]/15 text-[#1B4332]' : 'border-[#E8E6E1] text-[#4A4A4A]'}`}>{t.replace(/_/g, ' ')}</button>
                  ))}
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleIdFront} className="hidden" />
                  {form.id_front_url ? <span className="text-[#1B4332]">✓ ID uploaded</span> : <>Upload ID (front required)</>}
                </label>
                {(form.id_type === 'drivers_license' || form.id_type === 'state_id') && (
                  <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-4 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                    <input type="file" accept="image/*,.pdf" onChange={handleIdBack} className="hidden" />
                    {form.id_back_url ? <span className="text-[#1B4332]">✓ Back uploaded</span> : <>Back of ID (optional)</>}
                  </label>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => router.push('/sell')} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Cancel</button>
                <button type="button" onClick={() => setStep(2)} disabled={!form.full_name.trim() || !form.dob || !form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim() || !form.phone.trim() || form.ssn_last4.length !== 4 || !form.id_front_url} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Property ownership</h2>
              <p className="text-xs text-[#4A4A4A]">Upload a document showing you own or are authorized to list this property (tax bill, mortgage statement, title, or utility bill).</p>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Property address</label>
                <input value={form.ownership_address} onChange={(e) => setForm((f) => ({ ...f, ownership_address: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Street" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input value={form.ownership_city} onChange={(e) => setForm((f) => ({ ...f, ownership_city: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="City" />
                  <input value={form.ownership_state} onChange={(e) => setForm((f) => ({ ...f, ownership_state: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="State" />
                  <input value={form.ownership_zip} onChange={(e) => setForm((f) => ({ ...f, ownership_zip: e.target.value }))} className="h-10 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="ZIP" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Upload document (tax bill, mortgage, title, or utility)</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleOwnershipDoc} className="hidden" />
                  {form.ownership_doc_url ? <span className="text-[#1B4332]">✓ Uploaded</span> : <>Drag and drop or click to upload</>}
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!form.ownership_address.trim() || !form.ownership_city.trim() || !form.ownership_state.trim() || !form.ownership_zip.trim() || !form.ownership_doc_url} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Listing agreement</h2>
              <ul className="list-inside list-disc space-y-1 text-xs text-[#1A1A1A]">
                {LISTING_AGREEMENT_BULLETS.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Sign (type your full legal name)</label>
                <input value={form.signature} onChange={(e) => setForm((f) => ({ ...f, signature: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="John Smith" />
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.agreedToTerms} onChange={(e) => setForm((f) => ({ ...f, agreedToTerms: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-[#E8E6E1] text-[#1B4332]" />
                <span className="text-xs text-[#1A1A1A]">I agree to the terms above and the platform listing agreement.</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={() => setStep(4)} disabled={!form.signature.trim() || !form.agreedToTerms} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Review and submit</h2>
              <div className="rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] p-4 text-xs text-[#1A1A1A]">
                <p><strong className="text-[#4A4A4A]">Name:</strong> {form.full_name}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Address:</strong> {addressString || '—'}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Property:</strong> {ownershipAddressString || '—'}</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">ID:</strong> ✓</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Ownership doc:</strong> ✓</p>
                <p className="mt-1"><strong className="text-[#4A4A4A]">Signature:</strong> {form.signature}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit for verification'}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1B4332]/15 text-3xl text-[#1B4332]">✓</div>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">Verification submitted</h2>
              <p className="text-sm text-[#4A4A4A]">We&apos;ll review your seller verification within 1 business day. You&apos;ll receive an email when you can list your home.</p>
              <Link href="/sell/list" className="mt-4 inline-block w-full rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47]">Continue to list your home</Link>
              <Link href="/sell" className="mt-2 inline-block w-full rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-medium text-[#4A4A4A]">Back to Sell</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
