import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved homes',
  description:
    'View and manage your saved properties on HomeBase. Schedule tours and track your favorites.',
  openGraph: {
    title: 'Saved homes | HomeBase',
    description: 'View and manage your saved properties.',
  },
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
