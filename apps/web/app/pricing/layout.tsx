import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'HomeBase fee structure: 1% buyer fee, 1% seller fee. Savings calculator, comparison table, and FAQ.',
  openGraph: {
    title: 'Pricing | HomeBase',
    description: 'Simple, transparent fees. Save thousands vs traditional agents.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
