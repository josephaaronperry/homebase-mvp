import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse homes',
  description:
    'Homes on the market. Filter by price, beds, baths, and property type. Zillow-style search experience.',
  openGraph: {
    title: 'Browse homes | HomeBase',
    description:
      'Homes on the market. Filter by price, beds, baths, and property type.',
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
