import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const offerId = body?.offerId as string | undefined;
    const propertyId = body?.propertyId as string | undefined;
    if (!offerId || !propertyId) {
      return NextResponse.json({ error: 'Missing offerId or propertyId' }, { status: 400 });
    }
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: listing } = await supabase
      .from('seller_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .maybeSingle();
    if (!listing) {
      return NextResponse.json({ error: 'Not the seller for this property' }, { status: 403 });
    }
    const admin = getServiceRoleClient();

    const { data: offer, error: offerErr } = await admin
      .from('offers')
      .select('id, user_id, property_id, amount')
      .eq('id', offerId)
      .eq('property_id', propertyId)
      .single();
    if (offerErr || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    const buyerId = (offer as { user_id: string }).user_id;
    const amount = (offer as { amount: number | null }).amount ?? 0;

    const { data: prop, error: propErr } = await admin
      .from('properties')
      .select('address')
      .eq('id', propertyId)
      .maybeSingle();
    if (propErr) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const address = (prop as { address: string } | null)?.address ?? 'this property';

    await admin.from('offers').update({ status: 'ACCEPTED' }).eq('id', offerId);
    await admin.from('offers').update({ status: 'REJECTED' }).eq('property_id', propertyId).neq('id', offerId);

    await admin.from('deals').insert({
      property_id: propertyId,
      offer_id: offerId,
      buyer_id: buyerId,
      seller_id: user.id,
      agreed_price: amount,
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    const { data: pipelines } = await admin
      .from('buying_pipelines')
      .select('id, stage_completed_at')
      .eq('user_id', buyerId)
      .eq('property_id', propertyId);
    if (pipelines?.length) {
      const row = pipelines[0] as { id: string; stage_completed_at: Record<string, string> | null };
      const existing = row.stage_completed_at ?? {};
      await admin
        .from('buying_pipelines')
        .update({
          current_stage: 'offer_accepted',
          stage_completed_at: { ...existing, offer_accepted: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } else {
      await admin.from('buying_pipelines').insert({
        user_id: buyerId,
        property_id: propertyId,
        offer_id: offerId,
        current_stage: 'offer_accepted',
        stage_completed_at: { offer_accepted: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      });
    }

    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    await createNotification(
      buyerId,
      'offer_accepted',
      'Your offer was accepted! 🎉',
      `Your offer of ${formattedAmount} on ${address} was accepted. Select your lender to continue.`,
      `/dashboard/lenders?propertyId=${propertyId}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to accept offer' },
      { status: 500 }
    );
  }
}
