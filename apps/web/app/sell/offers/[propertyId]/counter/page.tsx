'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function SellCounterOfferPlaceholderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyId = params?.propertyId as string | undefined;
  const offerId = searchParams?.get('offerId');

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl border border-[#E8E6E1] bg-white p-8 text-center shadow-sm">
        <p className="text-4xl mb-4">📝</p>
        <h1 className="font-display text-xl font-semibold text-[#1A1A1A]">Counter offer</h1>
        <p className="mt-2 text-sm text-[#4A4A4A]">Submit a counter offer to the buyer. This flow is coming soon.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={propertyId ? `/sell/offers/${propertyId}` : '/sell/dashboard'}
            className="rounded-xl border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-semibold text-[#4A4A4A] hover:bg-[#F4F3F0]"
          >
            ← Back to offers
          </Link>
          <Link href="/sell/dashboard" className="text-sm text-[#1B4332] hover:underline">Seller dashboard</Link>
        </div>
      </div>
    </div>
  );
}
