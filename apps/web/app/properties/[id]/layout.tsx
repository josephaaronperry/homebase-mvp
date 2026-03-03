import type { Metadata } from 'next';

import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from('properties')
    .select('title, address, city, state, price')
    .eq('id', id)
    .maybeSingle();

  const p = data as { title?: string; address?: string; city?: string; state?: string; price?: number } | null;
  const title = p?.title || p?.address || `Property ${id}`;
  const location = [p?.address, p?.city, p?.state].filter(Boolean).join(', ');
  const priceStr = p?.price ? `$${Number(p.price).toLocaleString()}` : '';
  const description = location
    ? `${title}${priceStr ? ` — ${priceStr}` : ''}. ${location}`
    : `View property details for ${title}`;

  return {
    title: `${title}${priceStr ? ` — ${priceStr}` : ''}`,
    description,
    openGraph: {
      title: `${title} | HomeBase`,
      description,
    },
  };
}

export default function PropertyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
