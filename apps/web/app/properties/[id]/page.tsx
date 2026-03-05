import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PropertyDetailContent } from './PropertyDetailContent';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
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
    ? `${title}${priceStr ? ` - ${priceStr}` : ''}. ${location}`
    : `View property details for ${title}`;

  return {
    title: `${title}${priceStr ? ` - ${priceStr}` : ''}`,
    description,
    openGraph: {
      title: `${title} | HomeBase`,
      description,
    },
  };
}

type PropertyRow = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode?: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  propertyType: string | null;
  status: string | null;
  hoaFee: number | null;
  garage: boolean | number | string | null;
};

type SimilarRow = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  image_url: string | null;
};

async function getProperty(id: string): Promise<PropertyRow | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, title, address, city, state, zipCode, price, bedrooms, bathrooms, sqft, lotSize, yearBuilt, description, image_url, images, propertyType, status, hoaFee, garage'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[PropertyDetail] getProperty error:', error.message, 'id:', id);
    return null;
  }
  if (!data) {
    console.error('[PropertyDetail] notFound: no property for id', id);
    return null;
  }
  return data as PropertyRow;
}

async function getSimilar(
  id: string,
  city: string | null,
  price: number | null
): Promise<SimilarRow[]> {
  const supabase = await getSupabaseServerClient();

  if (!city && (price == null || price <= 0)) {
    const { data } = await supabase
      .from('properties')
      .select('id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url')
      .neq('id', id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(3);
    return ((data ?? []) as SimilarRow[]).slice(0, 3);
  }

  const low = price != null && price > 0 ? Math.round(price * 0.7) : 0;
  const high = price != null && price > 0 ? Math.round(price * 1.3) : 10_000_000;

  let q = supabase
    .from('properties')
    .select('id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url')
    .neq('id', id)
    .eq('status', 'ACTIVE')
    .gte('price', low)
    .lte('price', high)
    .order('created_at', { ascending: false })
    .limit(6);

  if (city) {
    q = q.ilike('city', city);
  }

  const { data } = await q;
  return ((data ?? []) as SimilarRow[]).slice(0, 3);
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const similar = await getSimilar(
    String(property.id),
    property.city ?? null,
    property.price
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homebase.example.com';
  const propertyUrl = `${baseUrl}/properties/${id}`;

  return (
    <PropertyDetailContent
      property={property}
      similarProperties={similar}
      propertyUrl={propertyUrl}
    />
  );
}
