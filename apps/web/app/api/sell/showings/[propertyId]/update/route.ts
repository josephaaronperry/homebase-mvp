// Schema verified against SCHEMA.md - 2025-03-01
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
    const showingId = body?.showingId as string | undefined;
    const action = body?.action as string | undefined; // 'confirm' | 'cancel'
    if (!propertyId || !showingId || !action || (action !== 'confirm' && action !== 'cancel')) {
      return NextResponse.json({ error: 'Missing propertyId, showingId, or invalid action' }, { status: 400 });
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
    const { data: showing, error: showErr } = await admin
      .from('showings')
      .select('id, userId')
      .eq('id', showingId)
      .eq('propertyId', propertyId)
      .single();
    if (showErr || !showing) {
      return NextResponse.json({ error: 'Showing not found' }, { status: 404 });
    }
    const buyerId = (showing as { userId: string }).userId;
    const newStatus = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED';
    await admin.from('showings').update({ status: newStatus }).eq('id', showingId);
    const { data: prop } = await admin.from('properties').select('address').eq('id', propertyId).maybeSingle();
    const address = (prop as { address: string } | null)?.address ?? 'the property';
    if (action === 'confirm') {
      await createNotification(
        buyerId,
        'tour_confirmed',
        'Tour confirmed',
        `Your tour for ${address} has been confirmed by the seller.`,
        '/showings'
      );
    } else {
      await createNotification(
        buyerId,
        'tour_cancelled',
        'Tour cancelled',
        `Your tour for ${address} was cancelled by the seller.`,
        '/showings'
      );
    }
    return NextResponse.json({ ok: true, status: newStatus });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update showing' },
      { status: 500 }
    );
  }
}
