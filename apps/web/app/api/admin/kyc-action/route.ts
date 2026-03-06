import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { submissionId, status, userEmail, reviewerNotes } = body as {
      submissionId?: string;
      status?: string;
      userEmail?: string;
      reviewerNotes?: string;
    };
    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const supabaseAdmin = getServiceRoleClient();

    const payload: { status: string; reviewed_at: string; reviewer_notes?: string } = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (reviewerNotes != null) payload.reviewer_notes = reviewerNotes;

    const { error: subError } = await supabaseAdmin
      .from('kyc_submissions')
      .update(payload)
      .eq('id', submissionId);
    if (subError) throw subError;

    if (userEmail) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({ kycStatus: status })
        .eq('email', userEmail);
      if (userError) throw userError;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[API admin/kyc-action]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
