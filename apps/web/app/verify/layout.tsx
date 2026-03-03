import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Identity verification | HomeBase',
  description:
    'Complete identity verification to unlock making offers on properties.',
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
