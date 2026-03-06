// Schema verified against SCHEMA.md - 2025-03-01
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';
import { offerAcceptedEmail, offerReceivedEmail } from '@/lib/email-templates';

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
      .select('id, userId, property_id, offerPrice')
      .eq('id', offerId)
      .eq('property_id', propertyId)
      .single();
    if (offerErr || !offer) {
      return NextResponse.json({ error: 'Offer not found', code: 'OFFER_NOT_FOUND' }, { status: 404 });
    }
    const buyerId = (offer as { userId: string }).userId;
    const amount = (offer as { offerPrice: number | null }).offerPrice ?? 0;

    const { data: existingDeal } = await admin
      .from('deals')
      .select('id')
      .eq('offer_id', offerId)
      .maybeSingle();
    if (existingDeal) {
      return NextResponse.json({ error: 'A deal already exists for this offer', code: 'DEAL_ALREADY_EXISTS' }, { status: 400 });
    }

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

    const { data: newDeal, error: dealErr } = await admin
      .from('deals')
      .insert({
        property_id: propertyId,
        offer_id: offerId,
        buyer_id: buyerId,
        seller_id: user.id,
        agreed_price: amount,
        status: 'pending_lender',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (dealErr || !newDeal) {
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
    }
    const dealId = (newDeal as { id: string }).id;

    // SPEC-4: Mark property as under contract
    await admin.from('properties').update({ status: 'under_contract' }).eq('id', propertyId);

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
      'Your offer was accepted!',
      'Your offer was accepted! Select your lender to continue.',
      `/lenders?dealId=${dealId}`
    );

    const [buyerAuth, sellerAuth] = await Promise.all([
      admin.auth.admin.getUserById(buyerId),
      admin.auth.admin.getUserById(user.id),
    ]);
    const buyerEmail = buyerAuth.data?.user?.email;
    const sellerEmail = sellerAuth.data?.user?.email;
    const { data: profiles } = await admin.from('users').select('id, fullName').in('id', [buyerId, user.id]);
    const profileMap = new Map((profiles ?? []).map((p: { id: string; fullName: string | null }) => [p.id, p.fullName ?? 'there']));
    const buyerName = profileMap.get(buyerId) ?? 'there';
    const sellerName = profileMap.get(user.id) ?? 'there';
    if (buyerEmail) {
      await sendEmail({
        to: buyerEmail,
        subject: 'Your offer was accepted! 🎉',
        html: offerAcceptedEmail(buyerName, address, formattedAmount, propertyId),
      });
    }
    if (sellerEmail) {
      await sendEmail({
        to: sellerEmail,
        subject: 'Offer accepted – summary',
        html: offerReceivedEmail(sellerName, address, formattedAmount, buyerName),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API offers/accept]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to accept offer', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
