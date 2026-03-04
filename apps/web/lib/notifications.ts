import { getServiceRoleClient } from '@/lib/supabase/service';

export type NotificationType =
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'tour_confirmed'
  | 'tour_cancelled'
  | 'kyc_approved'
  | 'pipeline_update';

/**
 * Create a notification for a user. Must be called from server (API route or server action).
 * Uses service role to bypass RLS.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      link: link ?? null,
      read: false,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { id: data?.id };
}
