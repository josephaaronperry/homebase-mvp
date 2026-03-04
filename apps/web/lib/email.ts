import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_placeholder')) {
    console.log('[Email] Skipped (no API key):', subject, '→', to);
    return;
  }
  try {
    await resend.emails.send({
      from: 'HomeBase <notifications@homebase.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[Email] Failed to send:', err);
  }
}
