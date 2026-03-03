'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MortgageCalculator } from '@/components/MortgageCalculator';
import { ScheduleTourModal } from '@/components/ScheduleTourModal';
import { SignInRequiredModal } from '@/components/SignInRequiredModal';

type Props = {
  propertyId: string | number;
  price: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
};

export function PropertySidebar({
  propertyId,
  price,
  address,
  city,
  state,
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signInModalAction, setSignInModalAction] = useState<'schedule a tour' | 'make an offer'>('schedule a tour');
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '' });
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (!u) return;
      const { data } = await supabase
        .from('kyc_submissions')
        .select('status')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setIsVerified((data as { status?: string } | null)?.status === 'APPROVED');
    };
    check();
  }, []);

  const handleScheduleTourClick = () => {
    if (!user) {
      setSignInModalAction('schedule a tour');
      setSignInModalOpen(true);
      return;
    }
    setTourModalOpen(true);
  };

  const handleMakeOfferClick = () => {
    if (!user) {
      setSignInModalAction('make an offer');
      setSignInModalOpen(true);
      return;
    }
    if (!isVerified) {
      router.push('/verify?message=You need to verify your identity before making an offer');
      return;
    }
    router.push(`/offers/new?propertyId=${propertyId}`);
  };

  const fmtPrice = price
    ? `$${price.toLocaleString()}`
    : 'Price on request';

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentSubmitting(true);
    // In production: send to CRM or agent notification system
    await new Promise((r) => setTimeout(r, 500));
    setAgentSubmitting(false);
    setAgentForm({ name: '', email: '', phone: '' });
  };

  return (
    <>
      <aside className="space-y-4 md:sticky md:top-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/90 p-4 text-xs text-slate-200">
          <div className="mb-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Price
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-50">
              {fmtPrice}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Estimated monthly payment shown below.
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleScheduleTourClick}
              className="w-full rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
            >
              Schedule a Tour
            </button>
            <button
              type="button"
              onClick={handleMakeOfferClick}
              className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold ${
                isVerified
                  ? 'border border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : 'cursor-not-allowed border border-slate-700 bg-slate-900/80 text-slate-500'
              }`}
              title={!isVerified ? 'Verify your identity to make an offer' : undefined}
            >
              {isVerified ? 'Make an Offer' : 'Make an Offer (verify identity)'}
            </button>
          </div>

          <form onSubmit={handleAgentSubmit} className="mt-4 space-y-2 border-t border-slate-800 pt-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Contact agent
            </div>
            <div>
              <label htmlFor="agent-name" className="sr-only">
                Your name
              </label>
              <input
                id="agent-name"
                className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
                placeholder="Your name"
                value={agentForm.name}
                onChange={(e) =>
                  setAgentForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="agent-email" className="sr-only">
                Email
              </label>
              <input
                id="agent-email"
                type="email"
                className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
                placeholder="Email"
                value={agentForm.email}
                onChange={(e) =>
                  setAgentForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="agent-phone" className="sr-only">
                Phone
              </label>
              <input
                id="agent-phone"
                className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400"
                placeholder="Phone"
                value={agentForm.phone}
                onChange={(e) =>
                  setAgentForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={agentSubmitting}
              className="w-full rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-70"
            >
              Contact agent
            </button>
          </form>
        </div>

        <MortgageCalculator price={price ?? 0} />
      </aside>

      {tourModalOpen && user && (
        <ScheduleTourModal
          propertyId={propertyId}
          propertyAddress={address}
          propertyCity={city}
          propertyState={state}
          onClose={() => setTourModalOpen(false)}
        />
      )}
      {signInModalOpen && (
        <SignInRequiredModal
          action={signInModalAction}
          onClose={() => setSignInModalOpen(false)}
        />
      )}
    </>
  );
}
