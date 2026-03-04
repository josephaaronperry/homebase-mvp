import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: listings } = await supabase
      .from('seller_listings')
      .select('property_id')
      .eq('user_id', user.id);
    const propertyIds = (listings ?? []).map((r: { property_id: string }) => r.property_id);
    if (propertyIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }
    const admin = getServiceRoleClient();
    const { data: rows } = await admin
      .from('offers')
      .select('property_id')
      .in('property_id', propertyIds);
    const counts: Record<string, number> = {};
    for (const id of propertyIds) counts[id] = 0;
    for (const r of rows ?? []) {
      const pid = (r as { property_id: string }).property_id;
      if (pid) counts[pid] = (counts[pid] ?? 0) + 1;
    }
    return NextResponse.json({ counts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load counts' },
      { status: 500 }
    );
  }
}
