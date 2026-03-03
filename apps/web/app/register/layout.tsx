import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
  description:
    'Create your HomeBase account. Save homes, track showings, and stay ahead of the market.',
  openGraph: {
    title: 'Create account | HomeBase',
    description: 'Create your account. Save homes, track showings, and more.',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
