import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse homes',
  description:
    'Explore homes across top U.S. markets. Filter by price, beds, baths, and property type.',
  openGraph: {
    title: 'Browse homes',
    description:
      'Explore homes across top U.S. markets.',
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
