// Schema verified against SCHEMA.md - 2025-03-01
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

const supabase = getSupabaseClient();

type Step = 1 | 2 | 3 | 4 | 5;

type Property = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  seller_id?: string;
};

const CONTINGENCY_TOOLTIPS: Record<string, string> = {
  inspection:
    'Allows you to back out or renegotiate if the home inspection reveals significant issues.',
  financing:
    'Protects you if your loan falls through. You can withdraw and typically get your earnest money back.',
  appraisal:
    'If the appraisal comes in below the offer price, you can renegotiate or walk away.',
  sale_of_home:
    'Offer is contingent on selling your current home. Gives you time to sell before closing.',
};

export default function NewOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') ?? searchParams.get('property');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOffer, setSubmittedOffer] = useState<{
    id: string;
    price: number;
    status: string;
  } | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [preApprovalChecked, setPreApprovalChecked] = useState(false);
  const [showNotYetMessage, setShowNotYetMessage] = useState(false);
  const [gate, setGate] = useState<{ kycApproved: boolean; preApprovalApproved: boolean } | null>(null);

  const [form, setForm] = useState({
    offer_price: 0,
    earnest_money: 0,
    closing_date: '',
    financing_type: 'CONVENTIONAL' as 'CASH' | 'CONVENTIONAL' | 'FHA' | 'VA',
    down_payment_pct: 20,
    pre_approval_url: '',
    inspection: false,
    financing: false,
    appraisal: false,
    sale_of_home: false,
    message_to_seller: '',
    agreed: false,
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?redirect=/offers/new');
        return;
      }
      const [propRes, userProfileRes] = await Promise.all([
        propertyId
          ? supabase.from('properties').select('id, title, address, city, state, price, seller_id').eq('id', propertyId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('users').select('kycStatus, preApprovalStatus').eq('id', user.id).maybeSingle(),
      ]);
      const profile = userProfileRes.data as { kycStatus?: string; preApprovalStatus?: string } | null;
      const kycApproved = profile?.kycStatus === 'APPROVED';
      const preApprovalApproved = profile?.preApprovalStatus === 'APPROVED';
      setGate({ kycApproved, preApprovalApproved });

      if (propRes.data) {
        const data = propRes.data;
        setProperty((data ?? null) as Property | null);
        if (data?.price) {
          setForm((f) => ({ ...f, offer_price: Number((data as { price: number }).price) }));
        }
      }
      setLoading(false);
    };
    load();
  }, [propertyId, router]);

  const handlePreApprovalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/preapproval-${Date.now()}.${file.name.split('.').pop() ?? 'pdf'}`;
    const { error } = await supabase.storage.from('kyc-docs').upload(path, file, { upsert: true });
    if (error) {
      alert(error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from('kyc-docs').getPublicUrl(path);
    setForm((f) => ({ ...f, pre_approval_url: urlData.publicUrl }));
  };

  const handleSubmit = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.agreed) return;

    setSubmitting(true);
    const contingencies: Record<string, boolean> = {
      inspection: form.inspection,
      financing: form.financing,
      appraisal: form.appraisal,
      sale_of_home: form.sale_of_home,
    };

    const { data, error } = await supabase
      .from('offers')
      .insert({
        userId: user.id,
        propertyId: propertyId || null,
        property_id: propertyId || null,
        buyer_id: user.id,
        offerPrice: form.offer_price,
        earnest_money: form.earnest_money || null,
        closing_date: form.closing_date || null,
        financingType: form.financing_type,
        down_payment_pct: form.financing_type !== 'CASH' ? form.down_payment_pct : null,
        pre_approval_url: form.pre_approval_url || null,
        inspection_contingency: form.inspection,
        financing_contingency: form.financing,
        appraisal_contingency: form.appraisal,
        sale_contingency: form.sale_of_home,
        seller_message: form.message_to_seller.trim() || null,
        status: 'SUBMITTED',
      })
      .select('id, offerPrice, status')
      .single();

    setSubmitting(false);
    if (error) {
      alert(error.message ?? 'Failed to submit offer');
      return;
    }
    const offerData = data as { id: string; offerPrice: number; status: string };
    if (propertyId && property) {
      const stageCompletedAt: Record<string, string> = { offer_submitted: new Date().toISOString() };
      await supabase.from('buying_pipelines').upsert(
        {
          user_id: user.id,
          property_id: propertyId,
          offer_id: offerData.id,
          current_stage: 'offer_submitted',
          stage_completed_at: stageCompletedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,property_id' }
      );
      const address = (property as { address?: string }).address ?? 'the property';
      if ((property as { seller_id?: string }).seller_id) {
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: (property as { seller_id: string }).seller_id,
              type: 'offer_received',
              title: 'New offer received',
              body: `You have a new offer on ${address}.`,
              link: '/sell/dashboard',
            }),
          });
        } catch {}
      }
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            type: 'pipeline_update',
            title: 'Transaction update',
            body: `Your transaction for ${address} has moved to Offer Submitted.`,
            link: `/dashboard/buying/${propertyId}`,
          }),
        });
      } catch {}
      router.replace(`/dashboard/buying/${propertyId}`);
      return;
    }
    setSubmittedOffer({ id: offerData.id, price: offerData.offerPrice, status: offerData.status });
  }, [form, propertyId, property, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-pulse rounded-full border-2 border-emerald-500/40" />
      </div>
    );
  }

  const canSubmitOffer = gate?.kycApproved && gate?.preApprovalApproved;
  if (gate && !canSubmitOffer) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
          <Link href={propertyId ? `/properties/${propertyId}` : '/offers'} className="inline-flex gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400">← Back</Link>
          <h1 className="mt-6 text-xl font-semibold text-slate-50">Before you can submit an offer</h1>
          <p className="mt-2 text-sm text-slate-400">Complete these steps to unlock offer submission.</p>
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className={gate.kycApproved ? 'text-slate-300' : 'text-slate-500'}>
                {gate.kycApproved ? '✅' : '⏳'} Identity verified
              </span>
              {!gate.kycApproved && (
                <Link href="/verify" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">Verify your identity →</Link>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={gate.preApprovalApproved ? 'text-slate-300' : 'text-slate-500'}>
                {gate.preApprovalApproved ? '✅' : '⏳'} Pre-approval on file
              </span>
              {!gate.preApprovalApproved && (
                <Link href="/pre-approval" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">Upload pre-approval →</Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!preApprovalChecked && propertyId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Pre-approval check</h2>
            <p className="mt-2 text-sm text-slate-400">
              Are you pre-approved for a mortgage or paying cash? Sellers prefer buyers who are ready to close.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setPreApprovalChecked(true)}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Paying cash
              </button>
              <button
                type="button"
                onClick={() => setPreApprovalChecked(true)}
                className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                Pre-approved (continue)
              </button>
              <button
                type="button"
                onClick={() => setShowNotYetMessage(true)}
                className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:border-slate-600"
              >
                Not yet
              </button>
            </div>
            {showNotYetMessage && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="font-medium">Get pre-approved first</p>
              <p className="mt-1 text-amber-200/90">
                We recommend: Better.com, Rocket Mortgage, or your local credit union. Once you have a pre-approval letter, return here to make your offer.
              </p>
              <button
                type="button"
                onClick={() => setPreApprovalChecked(true)}
                className="mt-3 text-xs font-semibold text-amber-300 underline"
              >
                I have pre-approval, continue
              </button>
            </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (submittedOffer) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
                ✓
              </div>
            </div>
            <h1 className="text-xl font-semibold text-slate-50">Offer submitted</h1>
            <p className="mt-2 text-sm text-slate-400">
              Your offer of ${submittedOffer.price.toLocaleString()} has been submitted.
              We&apos;ll notify you when the seller responds.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/transaction/${submittedOffer.id}`}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Track transaction
              </Link>
              <Link
                href="/offers"
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:border-slate-600"
              >
                View all offers
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const steps: { n: Step; label: string }[] = [
    { n: 1, label: 'Offer details' },
    { n: 2, label: 'Financing' },
    { n: 3, label: 'Contingencies' },
    { n: 4, label: 'Message' },
    { n: 5, label: 'Review' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href={propertyId ? `/properties/${propertyId}` : '/offers'}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400"
        >
          ← {propertyId ? 'Property' : 'Offers'}
        </Link>

        <h1 className="text-xl font-semibold text-slate-50">Make an offer</h1>
        {property && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Property</div>
            <div className="mt-1 font-medium text-slate-50">{property.address}</div>
            <div className="text-sm text-slate-400">{property.city}, {property.state}</div>
            {property.price != null && (
              <div className="mt-2 text-sm font-semibold text-emerald-400">
                List price: ${property.price.toLocaleString()}
              </div>
            )}
            <Link
              href={`/properties/${property.id}`}
              className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View property →
            </Link>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {steps.map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
                step === n
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : step > n
                    ? 'bg-slate-800/60 text-slate-400'
                    : 'bg-slate-900/60 text-slate-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Offer details</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Offer price
                </label>
                <input
                  type="number"
                  value={form.offer_price || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, offer_price: Number(e.target.value) || 0 }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Earnest money deposit
                </label>
                <input
                  type="number"
                  value={form.earnest_money || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, earnest_money: Number(e.target.value) || 0 }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Desired closing date
                </label>
                <input
                  type="date"
                  value={form.closing_date}
                  onChange={(e) => setForm((f) => ({ ...f, closing_date: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.offer_price}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Financing</h2>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Financing type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'CONVENTIONAL', 'FHA', 'VA'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, financing_type: t }))}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        form.financing_type === t
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {form.financing_type !== 'CASH' && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Down payment %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.down_payment_pct}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        down_payment_pct: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-slate-50 outline-none focus:border-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Pre-approval letter
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-xs text-slate-400 hover:border-emerald-500/60">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handlePreApprovalUpload}
                    className="hidden"
                  />
                  {form.pre_approval_url ? (
                    <span className="text-emerald-400">✓ Uploaded</span>
                  ) : (
                    <>Click to upload pre-approval letter</>
                  )}
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Contingencies</h2>
              <p className="text-xs text-slate-400">
                Select any contingencies to include in your offer.
              </p>
              {(
                [
                  ['inspection', 'Inspection contingency'],
                  ['financing', 'Financing contingency'],
                  ['appraisal', 'Appraisal contingency'],
                  ['sale_of_home', 'Sale of home contingency'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-start gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500"
                    />
                    <span className="text-sm text-slate-200">{label}</span>
                  </label>
                  <span
                    title={CONTINGENCY_TOOLTIPS[key]}
                    className="cursor-help text-slate-500 hover:text-slate-400"
                  >
                    ⓘ
                  </span>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">
                Personal message to seller (optional)
              </h2>
              <textarea
                value={form.message_to_seller}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message_to_seller: e.target.value }))
                }
                rows={4}
                placeholder="Introduce yourself, share why you love this home..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-50">Review and submit</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-200">
                <p><strong className="text-slate-400">Offer:</strong> ${form.offer_price.toLocaleString()}</p>
                <p className="mt-1"><strong className="text-slate-400">Earnest:</strong> ${form.earnest_money.toLocaleString()}</p>
                <p className="mt-1"><strong className="text-slate-400">Closing:</strong> {form.closing_date || '—'}</p>
                <p className="mt-1"><strong className="text-slate-400">Financing:</strong> {form.financing_type}</p>
                <p className="mt-1"><strong className="text-slate-400">Contingencies:</strong>{' '}
                  {[form.inspection && 'Inspection', form.financing && 'Financing', form.appraisal && 'Appraisal', form.sale_of_home && 'Sale of home']
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.agreed}
                  onChange={(e) => setForm((f) => ({ ...f, agreed: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500"
                />
                <span className="text-xs text-slate-300">
                  I understand this is a legally binding offer. I have read and agree to the terms.
                </span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!form.agreed || submitting}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit offer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
