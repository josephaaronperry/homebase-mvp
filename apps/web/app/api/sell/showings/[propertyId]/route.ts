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
    const { data: rows, error: showErr } = await admin
      .from('showings')
      .select('id, userId, requestedAt, confirmedAt, tour_type, status')
      .eq('propertyId', propertyId)
      .order('requestedAt', { ascending: true });
    if (showErr) {
      return NextResponse.json({ error: showErr.message }, { status: 500 });
    }
    const userIds = [...new Set((rows ?? []).map((r) => (r as { userId: string }).userId).filter(Boolean))] as string[];
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin.from('users').select('id, fullName').in('id', userIds);
      for (const p of profiles ?? []) {
        profileMap.set((p as { id: string }).id, (p as { fullName: string | null }).fullName ?? 'Buyer');
      }
    }
    const list = (rows ?? []).map((r) => {
      const row = r as { id: string; userId: string; requestedAt: string | null; confirmedAt: string | null; tour_type: string | null; status: string | null };
      const scheduledAt = row.confirmedAt ?? row.requestedAt;
      return {
        id: row.id,
        buyer_name: profileMap.get(row.userId) ?? 'Buyer',
        scheduled_at: scheduledAt,
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
