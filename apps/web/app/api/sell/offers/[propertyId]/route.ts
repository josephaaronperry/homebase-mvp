// Schema verified against SCHEMA.md - 2025-03-01
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
      .select('id, userId, offerPrice, status, financingType, closing_date, seller_message, createdAt')
      .eq('property_id', propertyId)
      .order('createdAt', { ascending: false });
    if (offersErr) {
      return NextResponse.json({ error: offersErr.message }, { status: 500 });
    }
    const userIds = [...new Set((offers ?? []).map((o) => (o as { userId: string }).userId).filter(Boolean))] as string[];
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('users')
        .select('id, fullName')
        .in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap.set((p as { id: string }).id, (p as { fullName: string | null }).fullName ?? 'Anonymous Buyer');
      }
    }
    const list = (offers ?? []).map((o) => {
      const row = o as { id: string; userId: string; offerPrice: number | null; status: string | null; financingType: string | null; closing_date: string | null; seller_message: string | null; createdAt: string | null };
      return {
        id: row.id,
        user_id: row.userId,
        buyer_name: row.userId ? profileMap.get(row.userId) ?? 'Anonymous Buyer' : 'Anonymous Buyer',
        amount: row.offerPrice,
        status: row.status,
        financing_type: row.financingType,
        closing_date: row.closing_date,
        message_to_seller: row.seller_message,
        created_at: row.createdAt,
      };
    });
    return NextResponse.json({ offers: list });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load offers' },
      { status: 500 }
    );
  }
}
