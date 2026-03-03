import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transaction timeline | HomeBase',
  description: 'Track your transaction progress from offer to closing.',
};

export default function TransactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
