import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications',
  description:
    'Your HomeBase notifications. Stay updated on offers, showings, and status changes.',
  openGraph: {
    title: 'Notifications | HomeBase',
    description: 'Stay updated on offers, showings, and status changes.',
  },
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
