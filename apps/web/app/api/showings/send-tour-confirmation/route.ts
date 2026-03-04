// Schema verified against SCHEMA.md - 2025-03-01
import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email';
import { tourConfirmedEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const showingId = body?.showingId as string | undefined;
    if (!showingId) {
      return NextResponse.json({ error: 'Missing showingId' }, { status: 400 });
    }
    const admin = getServiceRoleClient();
    const { data: showing, error: showErr } = await admin
      .from('showings')
      .select('id, userId, propertyId, requestedAt, confirmedAt')
      .eq('id', showingId)
      .single();
    if (showErr || !showing) {
      return NextResponse.json({ error: 'Showing not found' }, { status: 404 });
    }
    const userId = (showing as { userId: string }).userId;
    const propertyId = (showing as { propertyId: string }).propertyId;
    const scheduledAt = (showing as { confirmedAt: string | null }).confirmedAt ?? (showing as { requestedAt: string }).requestedAt;
    const d = new Date(scheduledAt);
    const { data: prop } = await admin.from('properties').select('address').eq('id', propertyId).maybeSingle();
    const propertyAddress = (prop as { address: string } | null)?.address ?? 'the property';
    const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const toEmail = authUser?.data?.user?.email;
    if (!toEmail) {
      return NextResponse.json({ ok: true });
    }
    const { data: profile } = await admin.from('users').select('fullName').eq('id', userId).maybeSingle();
    const buyerName = (profile as { fullName: string | null } | null)?.fullName ?? 'there';

    await sendEmail({
      to: toEmail,
      subject: 'Tour confirmed ✓',
      html: tourConfirmedEmail(buyerName, propertyAddress, date, time),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send tour confirmation' },
      { status: 500 }
    );
  }
}
