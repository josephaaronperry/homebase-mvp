import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      dealId,
      lender_name,
      interest_rate,
      apr,
      loan_term_years,
      monthly_payment_estimate,
      closing_costs,
      points,
    } = body as {
      dealId?: string;
      lender_name?: string;
      interest_rate?: number;
      apr?: number;
      loan_term_years?: number;
      monthly_payment_estimate?: number;
      closing_costs?: number;
      points?: number;
    };
    if (!dealId || !lender_name?.trim()) {
      return NextResponse.json({ error: 'dealId and lender_name required' }, { status: 400 });
    }
    const admin = getServiceRoleClient();
    const { error } = await admin.from('lender_proposals').insert({
      deal_id: dealId,
      lender_name: lender_name.trim(),
      interest_rate: interest_rate ?? null,
      apr: apr ?? null,
      loan_term_years: loan_term_years ?? null,
      monthly_payment_estimate: monthly_payment_estimate ?? null,
      closing_costs: closing_costs ?? null,
      points: points ?? null,
    });
    if (error) {
      console.error('[lender-portal proposal]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[lender-portal proposal]', err);
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 });
  }
}
