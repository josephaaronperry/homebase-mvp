import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import { lenderSelectedEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lenderSelectionId = body?.lenderSelectionId as string | undefined;
    if (!lenderSelectionId) {
      return NextResponse.json({ error: 'Missing lenderSelectionId' }, { status: 400 });
    }
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const admin = getServiceRoleClient();
    const { data: selection, error: selErr } = await admin
      .from('lender_selections')
      .select('id, user_id, lender_name, rate, estimated_monthly_payment, pipeline_id')
      .eq('id', lenderSelectionId)
      .single();
    if (selErr || !selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 });
    }
    if ((selection as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const pipelineId = (selection as { pipeline_id: string | null }).pipeline_id;
    let propertyId: string | null = null;
    if (pipelineId) {
      const { data: pipeline } = await admin
        .from('buying_pipelines')
        .select('property_id')
        .eq('id', pipelineId)
        .single();
      propertyId = (pipeline as { property_id: string } | null)?.property_id ?? null;
    }
    let propertyAddress = 'your property';
    if (propertyId) {
      const { data: prop } = await admin.from('properties').select('address').eq('id', propertyId).maybeSingle();
      propertyAddress = (prop as { address: string } | null)?.address ?? propertyAddress;
    }
    const { data: profile } = await admin.from('users').select('full_name').eq('id', user.id).maybeSingle();
    const buyerName = (profile as { full_name: string | null } | null)?.full_name ?? 'there';
    const lenderName = (selection as { lender_name: string | null }).lender_name ?? 'Your lender';
    const rate = (selection as { rate: number | null }).rate ?? 0;
    const monthly = (selection as { estimated_monthly_payment: number | null }).estimated_monthly_payment ?? 0;
    const rateStr = typeof rate === 'number' ? rate.toFixed(2) : String(rate);
    const monthlyStr = typeof monthly === 'number' ? `$${monthly.toLocaleString()}` : String(monthly);

    const toEmail = user.email;
    if (toEmail) {
      await sendEmail({
        to: toEmail,
        subject: 'Lender selected',
        html: lenderSelectedEmail(buyerName, propertyAddress, lenderName, rateStr, monthlyStr),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send lender confirmation' },
      { status: 500 }
    );
  }
}
