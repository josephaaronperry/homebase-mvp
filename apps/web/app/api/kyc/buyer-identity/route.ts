import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      full_name,
      dob,
      address,
      phone,
      ssn_last4,
      id_type,
      id_front_url,
      id_back_url,
    } = body as {
      full_name?: string;
      dob?: string;
      address?: string;
      phone?: string;
      ssn_last4?: string;
      id_type?: string;
      id_front_url?: string;
      id_back_url?: string | null;
    };

    const insertPayload = {
      user_id: user.id,
      status: 'PENDING',
      submission_type: 'buyer_identity',
      full_name: full_name ?? null,
      dob: dob || null,
      address: address || null,
      phone: phone || null,
      ssn_last4: ssn_last4 ?? null,
      id_type: id_type ?? 'drivers_license',
      proof_type: id_type ?? 'drivers_license',
      id_front_url: id_front_url || null,
      id_back_url: id_back_url || null,
      submitted_at: new Date().toISOString(),
    };

    const admin = getServiceRoleClient();
    const { error: insertError } = await admin.from('kyc_submissions').insert(insertPayload);
    if (insertError) {
      console.error('[KYC buyer-identity] insert failed', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const { error: rpcError } = await admin.rpc('set_user_kyc_status', {
      user_email: user.email ?? '',
      new_status: 'SUBMITTED',
    });
    if (rpcError) console.warn('[KYC buyer-identity] set_user_kyc_status:', rpcError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[KYC buyer-identity]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submission failed' },
      { status: 500 }
    );
  }
}
