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
    const { data: rows, error: showErr } = await admin
      .from('showings')
      .select('id, user_id, scheduled_at, tour_type, status')
      .eq('property_id', propertyId)
      .order('scheduled_at', { ascending: true });
    if (showErr) {
      return NextResponse.json({ error: showErr.message }, { status: 500 });
    }
    const userIds = [...new Set((rows ?? []).map((r) => (r as { user_id: string }).user_id).filter(Boolean))] as string[];
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('users').select('id, full_name').in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap.set((p as { id: string }).id, (p as { full_name: string | null }).full_name ?? 'Buyer');
      }
    }
    const list = (rows ?? []).map((r) => {
      const row = r as { id: string; user_id: string; scheduled_at: string | null; tour_type: string | null; status: string | null };
      return {
        id: row.id,
        buyer_name: profileMap.get(row.user_id) ?? 'Buyer',
        scheduled_at: row.scheduled_at,
        tour_type: row.tour_type ?? 'IN_PERSON',
        status: row.status ?? 'PENDING',
      };
    });
    return NextResponse.json({ showings: list });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load showings' },
      { status: 500 }
    );
  }
}
