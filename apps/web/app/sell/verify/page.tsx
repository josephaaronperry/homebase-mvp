'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3 | 4 | 5;

const LISTING_AGREEMENT_BULLETS = [
  'I am the legal owner or authorized to list this property.',
  'I will respond to offers and showings in good faith.',
  'Listing details are accurate to the best of my knowledge.',
  'I agree to the platform fee and terms of service.',
  'I agree to HomeBase Seller Terms.',
];

const AGENT_AGREEMENT_BULLETS = [
  'You represent that you are a licensed real estate agent in good standing.',
  'You confirm you have your client\'s authorization to list this property.',
  'Listing details are accurate to the best of your knowledge.',
  'You agree to the platform fee and terms of service for agents.',
  'You will respond to offers and showings in good faith on behalf of your client.',
];

const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

const OWNERSHIP_DOC_TYPES = [
  { value: 'property_tax_bill', label: 'Property tax bill' },
  { value: 'mortgage_statement', label: 'Mortgage statement' },
  { value: 'title_deed', label: 'Title / Deed' },
  { value: 'utility_bill', label: 'Utility bill at this address' },
];

function SellVerifyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyType = searchParams.get('type') === 'agent' ? 'agent' : 'fsbo';
  const isAgent = verifyType === 'agent';
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
    ownership_doc_type: 'property_tax_bill' as string,
    ownership_doc_url: '',
    signature: '',
    agreedToTerms: false,
    agent_name: '',
    agent_license: '',
    license_state: '',
    brokerage_name: '',
    brokerage_address: '',
    agent_license_url: '',
    client_name: '',
    agent_signature: '',
    agent_agreed: false,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
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
    async (bucket: string, pathPrefix: string, file: File) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
      const ext = file.name.split('.').pop() ?? 'pdf';
      const fullPath = `${user.id}/${pathPrefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true });
      if (error) throw new Error(error.message);
      return fullPath;
    },
    []
  );

  const handleIdFront = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'seller-id-front', file);
      setForm((f) => ({ ...f, id_front_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleIdBack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'seller-id-back', file);
      setForm((f) => ({ ...f, id_back_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleOwnershipDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'ownership', file);
      setForm((f) => ({ ...f, ownership_doc_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const handleLicenseDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await handleFileUpload('kyc-documents', 'agent-license', file);
      setForm((f) => ({ ...f, agent_license_url: path }));
    } catch (err) {
      alert((err as Error).message ?? 'Upload failed');
    }
  };

  const addressString = [form.street, form.city, form.state, form.zip].filter(Boolean).join(', ');
  const ownershipAddressString = [form.ownership_address, form.ownership_city, form.ownership_state, form.ownership_zip].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isAgent) {
      if (!form.agent_agreed || !form.agent_signature.trim()) {
        alert('Please sign and agree to the agent agreement.');
        return;
      }
    } else {
      if (!form.agreedToTerms || !form.signature.trim()) {
        alert('Please sign and agree to the listing agreement.');
        return;
      }
    }

    setSubmitting(true);
    const submissionType = isAgent ? 'seller_agent' : 'seller_fsbo';
    const payload: Record<string, unknown> = {
      user_id: user.id,
      status: 'PENDING',
      submission_type: submissionType,
      submitted_at: new Date().toISOString(),
    };
    if (isAgent) {
      payload.full_name = form.agent_name || null;
      payload.agent_license = form.agent_license || null;
      payload.agent_brokerage = form.brokerage_name || null;
      payload.agent_license_url = form.agent_license_url || null;
      payload.client_name = form.client_name || null;
      payload.listing_agreement_signed_at = new Date().toISOString();
    } else {
      payload.full_name = form.full_name || null;
      payload.dob = form.dob || null;
      payload.ssn_last4 = form.ssn_last4 || null;
      payload.address = addressString || null;
      payload.phone = form.phone || null;
      payload.id_type = form.id_type || null;
      payload.id_front_url = form.id_front_url || null;
      payload.id_back_url = form.id_back_url || null;
      payload.ownership_doc_url = form.ownership_doc_url || null;
      payload.ownership_property_address = ownershipAddressString || null;
      payload.proof_type = form.ownership_doc_type || null;
      payload.listing_agreement_signed_at = new Date().toISOString();
    }

    const { error } = await supabase.from('kyc_submissions').insert(payload);
    if (error) {
      setSubmitting(false);
      alert(error.message ?? 'Failed to submit');
      return;
    }
    const { error: updateErr } = await supabase.from('users').update({ kycStatus: 'PENDING' }).eq('id', user.id);
    if (updateErr) console.warn('Could not update users.kycStatus:', updateErr.message);
    setSubmitting(false);
    setStep(isAgent ? 3 : 4);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-[#1B4332]/40" />
      </div>
    );
  }

  const stepsFsbo = [
    { n: 1 as Step, label: 'Identity' },
    { n: 2 as Step, label: 'Ownership' },
    { n: 3 as Step, label: 'Agreement' },
  ];
  const stepsAgent = [
    { n: 1 as Step, label: 'License' },
    { n: 2 as Step, label: 'Agreement' },
  ];
  const steps = isAgent ? stepsAgent : stepsFsbo;
  const displayStepFsbo = step <= 3 ? step : 3;
  const displayStepAgent = step <= 2 ? step : 2;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/sell" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#4A4A4A] hover:text-[#52B788]">← Sell</Link>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1A1A1A]">{isAgent ? 'Verify your agent license' : 'Verify your identity as a seller'}</h1>
        <p className="mt-1 text-sm text-[#4A4A4A]">{isAgent ? 'Verify your license to list on behalf of your client.' : 'Verify your identity and property ownership to list your home.'}</p>

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => {
            const active = isAgent ? (n === displayStepAgent) : (n === displayStepFsbo);
            const done = isAgent ? (n < displayStepAgent || step > 2) : (n < displayStepFsbo || step > 3);
            return (
              <div
                key={n}
                className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
                  active ? 'bg-[#1B4332] text-white' : done ? 'bg-[#E8E6E1] text-[#4A4A4A]' : 'bg-[#F4F3F0] text-[#888888]'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
          {isAgent && step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">License verification</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Agent full name *</label>
                <input value={form.agent_name} onChange={(e) => setForm((f) => ({ ...f, agent_name: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="John Smith" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">License number *</label>
                <input value={form.agent_license} onChange={(e) => setForm((f) => ({ ...f, agent_license: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="License #" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">State of license *</label>
                <select value={form.license_state} onChange={(e) => setForm((f) => ({ ...f, license_state: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A]">
                  <option value="">Select state</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Brokerage name *</label>
                <input value={form.brokerage_name} onChange={(e) => setForm((f) => ({ ...f, brokerage_name: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Brokerage" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Brokerage address *</label>
                <input value={form.brokerage_address} onChange={(e) => setForm((f) => ({ ...f, brokerage_address: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Street, City, State ZIP" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Upload license certificate or state license lookup screenshot *</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8E6E1] bg-[#F4F3F0] px-4 py-6 text-center text-xs text-[#4A4A4A] hover:border-[#1B4332]">
                  <input type="file" accept="image/*,.pdf" onChange={handleLicenseDoc} className="hidden" />
                  {form.agent_license_url ? <span className="text-[#1B4332]">✓ Uploaded</span> : <>Drag and drop or click to upload</>}
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => router.push('/sell')} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Cancel</button>
                <button type="button" onClick={() => setStep(2)} disabled={!form.agent_name.trim() || !form.agent_license.trim() || !form.license_state.trim() || !form.brokerage_name.trim() || !form.brokerage_address.trim() || !form.agent_license_url} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}
          {isAgent && step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Agent agreement</h2>
              <ul className="list-inside list-disc space-y-1 text-xs text-[#1A1A1A]">
                {AGENT_AGREEMENT_BULLETS.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Client name (seller you represent) *</label>
                <input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Full legal name of seller" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Sign (type your full name)</label>
                <input value={form.agent_signature} onChange={(e) => setForm((f) => ({ ...f, agent_signature: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="John Smith" />
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={form.agent_agreed} onChange={(e) => setForm((f) => ({ ...f, agent_agreed: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-[#E8E6E1] text-[#1B4332]" />
                <span className="text-xs text-[#1A1A1A]">I agree to the terms above.</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={submitting || !form.agent_signature.trim() || !form.agent_agreed || !form.client_name.trim()} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit for verification'}</button>
              </div>
            </div>
          )}
          {!isAgent && step === 1 && (
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

          {step === 2 && !isAgent && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Property ownership</h2>
              <p className="text-xs text-[#4A4A4A]">Upload a document showing you own or are authorized to list this property.</p>
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
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Document type</label>
                <select value={form.ownership_doc_type} onChange={(e) => setForm((f) => ({ ...f, ownership_doc_type: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A]">
                  {OWNERSHIP_DOC_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#4A4A4A]">Upload document</label>
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

          {step === 3 && !isAgent && (
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
                <span className="text-xs text-[#1A1A1A]">I agree to HomeBase Seller Terms.</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-[#E8E6E1] py-2 text-xs font-semibold text-[#4A4A4A]">Back</button>
                <button type="button" onClick={handleSubmit} disabled={submitting || !form.signature.trim() || !form.agreedToTerms} className="flex-1 rounded-xl bg-[#1B4332] py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit for verification'}</button>
              </div>
            </div>
          )}

          {((!isAgent && step === 4) || (isAgent && step === 3)) && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5] text-3xl text-[#065F46]">✓</div>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1A1A1A]">Verification submitted</h2>
              <p className="text-sm text-[#4A4A4A]">We&apos;ll review within 1 business day.</p>
              <Link href={isAgent ? '/sell/list?type=agent' : '/sell/list?type=fsbo'} className="mt-4 inline-block w-full rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47]">Back to listing</Link>
              <Link href="/sell" className="mt-2 inline-block w-full rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-medium text-[#4A4A4A]">Back to Sell</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SellVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#1B4332] border-t-transparent animate-spin" /></div>}>
      <SellVerifyPageInner />
    </Suspense>
  );
}
