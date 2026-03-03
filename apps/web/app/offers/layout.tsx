import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My offers',
  description:
    'View and manage your property offers. Track offer status, counters, and next steps.',
  openGraph: {
    title: 'My offers | HomeBase',
    description: 'View and manage your property offers.',
  },
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
