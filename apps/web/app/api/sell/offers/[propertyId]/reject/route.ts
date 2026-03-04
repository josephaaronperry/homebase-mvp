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
      .select('id, user_id')
      .eq('id', offerId)
      .eq('property_id', propertyId)
      .single();
    if (offerErr || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    const buyerId = (offer as { user_id: string }).user_id;
    await admin.from('offers').update({ status: 'REJECTED' }).eq('id', offerId);
    const { data: prop } = await admin.from('properties').select('address').eq('id', propertyId).maybeSingle();
    const address = (prop as { address: string } | null)?.address ?? 'the property';
    await createNotification(
      buyerId,
      'offer_rejected',
      'Offer declined',
      `Your offer on ${address} was declined by the seller.`,
      '/offers'
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reject offer' },
      { status: 500 }
    );
  }
}
