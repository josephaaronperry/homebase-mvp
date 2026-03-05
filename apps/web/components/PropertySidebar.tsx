'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

import { MortgageCalculator } from '@/components/MortgageCalculator';
import { ScheduleTourModal } from '@/components/ScheduleTourModal';
import { SignInRequiredModal } from '@/components/SignInRequiredModal';
import { useToast } from '@/components/ToastProvider';

type Props = {
  propertyId: string | number;
  price: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  sellerName?: string | null;
  estMonthly?: number | null;
  showSave?: boolean;
  saved?: boolean;
  onSaveClick?: (e: React.MouseEvent) => void;
  shareUrl?: string;
};

export function PropertySidebar({
  propertyId,
  price,
  address,
  city,
  state,
  sellerName = 'Private seller',
  estMonthly = null,
  showSave = false,
  saved = false,
  onSaveClick,
  shareUrl,
}: Props) {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signInModalAction, setSignInModalAction] = useState<'schedule a tour' | 'make an offer'>('schedule a tour');
  const [sellerMessage, setSellerMessage] = useState('');
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const toast = useToast();

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

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellerSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setSellerSubmitting(false);
    setSellerMessage('');
    toast('Message sent to seller.');
  };

  return (
    <>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5 text-xs shadow-lg">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="font-[family-name:var(--font-mono)] text-xl font-bold text-[#1A1A1A]">
                {fmtPrice}
              </div>
              <p className="mt-1 text-[11px] text-[#4A4A4A]">Listed by {sellerName}</p>
            </div>
            {showSave && (
              <button
                type="button"
                onClick={onSaveClick}
                className="rounded-full p-2 text-lg hover:bg-[#F4F3F0]"
                aria-label={saved ? 'Unsave home' : 'Save home'}
              >
                {saved ? '❤️' : '🤍'}
              </button>
            )}
          </div>
          {estMonthly != null && (
            <p className="mb-3 text-sm text-[#4A4A4A]">
              Est. ${estMonthly.toLocaleString()}/mo
              <span className="block text-[10px] text-[#888888]">20% down, 30yr fixed at 6.8%</span>
            </p>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleScheduleTourClick}
              className="w-full rounded-xl bg-[#1B4332] px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#2D5A47]"
            >
              Schedule a Tour
            </button>
            <button
              type="button"
              onClick={handleMakeOfferClick}
              className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold ${
                isVerified
                  ? 'border border-[#1B4332] bg-[#1B4332]/10 text-[#52B788] hover:bg-[#1B4332]/20'
                  : 'cursor-not-allowed border border-[#E8E6E1] bg-[#F4F3F0] text-[#888888]'
              }`}
              title={!isVerified ? 'Verify your identity to make an offer' : undefined}
            >
              {isVerified ? 'Make an Offer' : 'Make an Offer (verify identity)'}
            </button>
          </div>

          <form onSubmit={handleSellerSubmit} className="mt-4 space-y-2 border-t border-[#E8E6E1] pt-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#4A4A4A]">
              Contact seller
            </div>
            <div>
              <label htmlFor="seller-message" className="sr-only">
                Message to seller
              </label>
              <textarea
                id="seller-message"
                rows={3}
                className="h-auto w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none placeholder:text-[#888888] focus:border-[#1B4332] focus:ring-1 focus:ring-[#52B788]/40"
                placeholder="Your message to the seller..."
                value={sellerMessage}
                onChange={(e) => setSellerMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={sellerSubmitting}
              className="w-full rounded-xl bg-[#1B4332] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2D5A47] disabled:opacity-70"
            >
              Send message
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 border-t border-[#E8E6E1] pt-4 text-[11px] text-[#4A4A4A]">
            <span>🔒 Verified listing</span>
            <span>✓ No agent fees</span>
            <span>📋 Guided closing</span>
          </div>
        </div>
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
