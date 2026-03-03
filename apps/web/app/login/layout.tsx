import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to HomeBase to access your dashboard, saved homes, showings, and offers.',
  openGraph: {
    title: 'Sign in | HomeBase',
    description: 'Sign in to access your dashboard, saved homes, and offers.',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
