import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const dealId = req.nextUrl.searchParams.get('dealId');
    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }
    const admin = getServiceRoleClient();
    const { data: deal, error: dealErr } = await admin
      .from('deals')
      .select('id, property_id, agreed_price, buyer_id')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    const d = deal as { property_id: string; buyer_id: string; agreed_price: number; id: string };
    const [propRes, userRes] = await Promise.all([
      admin.from('properties').select('address, city, state, zipCode').eq('id', d.property_id).maybeSingle(),
      admin.from('users').select('kycStatus').eq('id', d.buyer_id).maybeSingle(),
    ]);
    const prop = propRes.data as { address?: string; city?: string; state?: string; zipCode?: string } | null;
    const user = userRes.data as { kycStatus?: string } | null;
    const parts = [prop?.address, prop?.city, prop?.state, prop?.zipCode].filter(Boolean);
    const property_address = parts.length ? parts.join(', ') : '—';
    const estimated_loan_amount = Math.round(d.agreed_price * 0.8);
    const buyer_identity_status = user?.kycStatus === 'VERIFIED' ? 'Verified ✓' : 'Pending';
    return NextResponse.json({
      dealId: d.id,
      property_address,
      agreed_price: d.agreed_price,
      estimated_loan_amount,
      buyer_identity_status,
      estimated_closing_date: null as string | null,
    });
  } catch (err) {
    console.error('[lender-portal deal]', err);
    return NextResponse.json({ error: 'Failed to load deal' }, { status: 500 });
  }
}
