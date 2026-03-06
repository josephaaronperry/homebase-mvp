import type { Metadata } from 'next';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase';
import { HomePageContent } from '@/components/HomePageContent';

type Property = {
  id: string | number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  image_url?: string | null;
  images?: string[] | null;
  featured?: boolean;
};

async function getNewestActiveProperties(): Promise<Property[]> {
  const supabaseClient = await getSupabaseServerClient();
  const { data, error } = await supabaseClient
    .from('properties')
    .select('id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url, images, featured')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(4);
  if (error) return [];
  return (data ?? []) as Property[];
}

async function getListingCount(): Promise<number> {
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');
  return count ?? 0;
}

export const metadata: Metadata = {
  title: 'Buy your home. Keep the commission.',
  description:
    'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  openGraph: {
    title: 'HomeBase — Buy your home. Keep the commission.',
    description:
      'HomeBase guides you through every step of buying or selling — without an agent. The average buyer saves $23,000.',
  },
};

export default async function HomePage() {
  const featuredProperties = await getNewestActiveProperties();
  const listingCount = await getListingCount();
  const heroPhotos = featuredProperties.slice(0, 3);

  return (
    <HomePageContent
      featuredProperties={featuredProperties}
      listingCount={listingCount}
      heroPhotos={heroPhotos}
    />
  );
}
