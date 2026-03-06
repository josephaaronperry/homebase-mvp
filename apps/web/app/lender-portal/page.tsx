'use client';

import { useState } from 'react';
import Link from 'next/link';

type DealPacket = {
  dealId: string;
  property_address: string;
  agreed_price: number;
  estimated_loan_amount: number;
  buyer_identity_status: string;
  estimated_closing_date: string | null;
};

export default function LenderPortalPage() {
  const [dealIdInput, setDealIdInput] = useState('');
  const [deal, setDeal] = useState<DealPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    lender_name: '',
    interest_rate: '',
    apr: '',
    loan_term_years: '30',
    loan_type: 'Fixed',
    monthly_payment_estimate: '',
    closing_costs: '',
    points: '0',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadDeal = async () => {
    const id = dealIdInput.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lender-portal/deal?dealId=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Deal not found');
        setDeal(null);
        return;
      }
      setDeal(data as DealPacket);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/lender-portal/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.dealId,
          lender_name: form.lender_name.trim(),
          interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
          apr: form.apr ? parseFloat(form.apr) : null,
          loan_term_years: form.loan_term_years ? parseInt(form.loan_term_years, 10) : null,
          monthly_payment_estimate: form.monthly_payment_estimate ? parseFloat(form.monthly_payment_estimate) : null,
          closing_costs: form.closing_costs ? parseFloat(form.closing_costs) : null,
          points: form.points ? parseFloat(form.points) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Failed to submit proposal');
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-8 shadow-sm">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[#1A1A1A]">Lender Partner Portal</h1>
          <p className="mt-1 text-sm text-[#4A4A4A]">HomeBase — Submit your rate proposal for a deal.</p>

          {!deal ? (
            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-[#4A4A4A]">Enter deal ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dealIdInput}
                  onChange={(e) => setDealIdInput(e.target.value)}
                  placeholder="e.g. uuid from link"
                  className="h-11 flex-1 rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm placeholder:text-[#888888]"
                />
                <button
                  type="button"
                  onClick={loadDeal}
                  disabled={loading || !dealIdInput.trim()}
                  className="rounded-xl bg-[#1B4332] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50"
                >
                  {loading ? 'Loading…' : 'View deal'}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            </div>
          ) : submitted ? (
            <div className="mt-8 rounded-xl border border-[#2D6A4F] bg-[#D8F3DC] p-4 text-sm text-[#1B4332]">
              <p className="font-medium">Proposal submitted.</p>
              <p className="mt-1">The buyer will be notified to review competing offers.</p>
              <button
                type="button"
                onClick={() => { setDeal(null); setSubmitted(false); setForm({ lender_name: '', interest_rate: '', apr: '', loan_term_years: '30', loan_type: 'Fixed', monthly_payment_estimate: '', closing_costs: '', points: '0', notes: '' }); }}
                className="mt-4 rounded-xl bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2D5A47]"
              >
                Submit another proposal
              </button>
            </div>
          ) : (
            <>
              <div className="mt-8 rounded-xl border border-[#E8E6E1] bg-[#F4F3F0] p-4">
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#1A1A1A]">Deal packet</h2>
                <dl className="mt-3 space-y-1 text-sm">
                  <div><dt className="text-[#4A4A4A]">Property address</dt><dd className="font-medium text-[#1A1A1A]">{deal.property_address}</dd></div>
                  <div><dt className="text-[#4A4A4A]">Accepted offer price</dt><dd className="font-medium text-[#1A1A1A]">${Number(deal.agreed_price).toLocaleString()}</dd></div>
                  <div><dt className="text-[#4A4A4A]">Estimated loan amount</dt><dd className="font-medium text-[#1A1A1A]">${deal.estimated_loan_amount.toLocaleString()}</dd></div>
                  <div><dt className="text-[#4A4A4A]">Buyer identity status</dt><dd className="font-medium text-[#1A1A1A]">{deal.buyer_identity_status}</dd></div>
                  <div><dt className="text-[#4A4A4A]">Estimated closing date</dt><dd className="font-medium text-[#1A1A1A]">{deal.estimated_closing_date ?? '—'}</dd></div>
                </dl>
                <button type="button" onClick={() => setDeal(null)} className="mt-3 text-xs font-medium text-[#1B4332] hover:underline">← Use a different deal ID</button>
              </div>

              <form onSubmit={handleSubmitProposal} className="mt-8 space-y-4">
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#1A1A1A]">Submit your proposal</h2>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Lender / your name *</label>
                  <input value={form.lender_name} onChange={(e) => setForm((f) => ({ ...f, lender_name: e.target.value }))} required className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="Acme Home Loans" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Interest rate (%)</label>
                    <input type="number" step="0.125" min="0" value={form.interest_rate} onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="6.5" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">APR (%)</label>
                    <input type="number" step="0.01" min="0" value={form.apr} onChange={(e) => setForm((f) => ({ ...f, apr: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="6.75" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Loan term</label>
                    <select value={form.loan_term_years} onChange={(e) => setForm((f) => ({ ...f, loan_term_years: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A]">
                      <option value="15">15 year</option>
                      <option value="20">20 year</option>
                      <option value="30">30 year</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Loan type</label>
                    <select value={form.loan_type} onChange={(e) => setForm((f) => ({ ...f, loan_type: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm text-[#1A1A1A]">
                      <option value="Fixed">Fixed</option>
                      <option value="ARM">ARM</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Monthly payment ($)</label>
                    <input type="number" min="0" value={form.monthly_payment_estimate} onChange={(e) => setForm((f) => ({ ...f, monthly_payment_estimate: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="2500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Closing costs ($)</label>
                    <input type="number" min="0" value={form.closing_costs} onChange={(e) => setForm((f) => ({ ...f, closing_costs: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="5000" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Points (0–3)</label>
                  <input type="number" step="0.25" min="0" max="3" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} className="h-10 w-full rounded-xl border border-[#E8E6E1] bg-white px-3 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4A4A4A]">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm placeholder:text-[#888888]" placeholder="Optional" />
                </div>
                <button type="submit" disabled={submitting || !form.lender_name.trim()} className="w-full rounded-xl bg-[#1B4332] py-3 text-sm font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit proposal'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-[#4A4A4A] hover:text-[#1B4332]">← HomeBase</Link>
        </p>
      </main>
    </div>
  );
}
