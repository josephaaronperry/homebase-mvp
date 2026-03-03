import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: ids, error: rpcError } = await supabase.rpc('search_properties', {
      query: q,
    });

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    const idList = (ids ?? []) as { id: string }[];
    const idsOnly = idList.map((r) => r.id);

    if (idsOnly.length === 0) {
      return NextResponse.json({ properties: [] });
    }

    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, title, address, city, state, price, bedrooms, bathrooms, sqft, image_url, property_type')
      .in('id', idsOnly)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const ordered = idsOnly
      .map((id) => (properties ?? []).find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ properties: ordered });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 }
    );
  }
}
