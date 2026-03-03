import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset password',
  description:
    'Reset your HomeBase account password. Enter your email to receive a reset link.',
  openGraph: {
    title: 'Reset password | HomeBase',
    description: 'Reset your account password.',
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
