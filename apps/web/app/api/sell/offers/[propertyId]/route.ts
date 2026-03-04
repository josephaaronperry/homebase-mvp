import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
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
    const { data: offers, error: offersErr } = await admin
      .from('offers')
      .select('id, user_id, amount, status, financing_type, closing_date, message_to_seller, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (offersErr) {
      return NextResponse.json({ error: offersErr.message }, { status: 500 });
    }
    const userIds = [...new Set((offers ?? []).map((o) => o.user_id).filter(Boolean))] as string[];
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('users')
        .select('id, full_name')
        .in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap.set(p.id, (p as { full_name: string | null }).full_name ?? 'Anonymous Buyer');
      }
    }
    const list = (offers ?? []).map((o) => ({
      id: o.id,
      user_id: o.user_id,
      buyer_name: o.user_id ? profileMap.get(o.user_id) ?? 'Anonymous Buyer' : 'Anonymous Buyer',
      amount: o.amount,
      status: o.status,
      financing_type: o.financing_type,
      closing_date: o.closing_date,
      message_to_seller: o.message_to_seller,
      created_at: o.created_at,
    }));
    return NextResponse.json({ offers: list });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load offers' },
      { status: 500 }
    );
  }
}
