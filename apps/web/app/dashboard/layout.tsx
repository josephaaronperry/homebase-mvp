import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Your HomeBase dashboard. Track saved homes, upcoming showings, recent offers, and market activity.',
  openGraph: {
    title: 'Dashboard | HomeBase',
    description: 'Track saved homes, showings, offers, and market activity.',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
