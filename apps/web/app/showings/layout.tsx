import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Showings',
  description:
    'View and manage your scheduled property showings. Keep track of upcoming and past home tours.',
  openGraph: {
    title: 'Showings | HomeBase',
    description: 'Manage your scheduled property showings.',
  },
};

export default function ShowingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
