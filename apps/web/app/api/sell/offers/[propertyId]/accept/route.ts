import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const body = await request.json().catch(() => ({}));
    const offerId = body?.offerId as string | undefined;
    if (!propertyId || !offerId) {
      return NextResponse.json({ error: 'Missing propertyId or offerId' }, { status: 400 });
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
      .select('id, user_id, property_id')
      .eq('id', offerId)
      .eq('property_id', propertyId)
      .single();
    if (offerErr || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    const buyerId = (offer as { user_id: string }).user_id;
    await admin.from('offers').update({ status: 'ACCEPTED' }).eq('id', offerId);
    const { data: pipelines } = await admin
      .from('buying_pipelines')
      .select('id, stage_completed_at')
      .eq('offer_id', offerId);
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
    }
    const { data: prop } = await admin.from('properties').select('address').eq('id', propertyId).maybeSingle();
    const address = (prop as { address: string } | null)?.address ?? 'the property';
    await createNotification(
      buyerId,
      'offer_accepted',
      'Your offer was accepted!',
      `Your offer on ${address} has been accepted. Log in to continue your transaction.`,
      `/dashboard/buying/${propertyId}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to accept offer' },
      { status: 500 }
    );
  }
}
