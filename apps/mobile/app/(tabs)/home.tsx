import { useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

type SavedPreview = {
  id: string | number;
  property_id: string | number;
  price: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image_url: string | null;
  title: string | null;
};

type ShowingPreview = {
  id: string | number;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  scheduled_at: string | null;
  status?: string | null;
};

type OfferPreview = {
  id: string | number;
  property_id: string | number;
  amount: number | null;
  status: string | null;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [showings, setShowings] = useState<ShowingPreview[]>([]);
  const [offers, setOffers] = useState<OfferPreview[]>([]);
  const [saved, setSaved] = useState<SavedPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      setUserName((user.user_metadata as { full_name?: string })?.full_name ?? null);
      setUserEmail(user.email ?? null);

      const [
        { count: savedCountRes },
        showingsRes,
        offersRes,
        savedRes,
      ] = await Promise.all([
        supabase.from('saved_properties').select('*', { count: 'exact', head: true }),
        supabase
          .from('showings')
          .select('id, property_address, property_city, property_state, scheduled_at, status')
          .order('scheduled_at', { ascending: true })
          .limit(3),
        supabase
          .from('offers')
          .select('id, property_id, amount, status')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('saved_properties_with_details')
          .select('id, property_id, price, address, city, state, beds, baths, sqft, image_url, title')
          .limit(3),
      ]);

      setSavedCount(savedCountRes ?? 0);
      setShowings((showingsRes.data ?? []) as ShowingPreview[]);
      setOffers((offersRes.data ?? []) as OfferPreview[]);
      setSaved((savedRes.data ?? []) as SavedPreview[]);
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  const greeting = userName ? `Hi, ${userName.split(' ')[0]}` : 'Welcome back';

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-14">
        <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Dashboard
        </Text>
        <Text className="mt-2 text-3xl font-bold text-white">{greeting}</Text>
        {userEmail ? (
          <Text className="mt-1 text-sm text-slate-400">{userEmail}</Text>
        ) : null}
      </View>

      <View className="mt-8 px-6">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Saved homes
            </Text>
            <Text className="mt-1 text-2xl font-bold text-white">{savedCount}</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Upcoming tours
            </Text>
            <Text className="mt-1 text-2xl font-bold text-white">{showings.length}</Text>
          </View>
        </View>
      </View>

      <View className="mt-8 px-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-white">Quick actions</Text>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-3">
          <Link href="/(tabs)/search" asChild>
            <TouchableOpacity className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5">
              <Text className="text-sm font-semibold text-slate-200">Browse homes</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/saved" asChild>
            <TouchableOpacity className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5">
              <Text className="text-sm font-semibold text-slate-200">Saved</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/showings" asChild>
            <TouchableOpacity className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5">
              <Text className="text-sm font-semibold text-slate-200">Showings</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {showings.length > 0 && (
        <View className="mt-8 px-6">
          <Text className="text-sm font-semibold text-white">Upcoming showings</Text>
          <View className="mt-3 gap-3">
            {showings.map((s) => (
              <View
                key={s.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3"
              >
                <Text className="text-sm font-medium text-slate-100">
                  {s.property_address ?? 'Address'}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {s.property_city}, {s.property_state}
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {offers.length > 0 && (
        <View className="mt-8 px-6">
          <Text className="text-sm font-semibold text-white">Recent offers</Text>
          <View className="mt-3 gap-3">
            {offers.map((o) => (
              <Link key={o.id} href={`/properties/${o.property_id}`} asChild>
                <TouchableOpacity className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                  <Text className="text-sm font-medium text-slate-100">
                    ${o.amount != null ? Number(o.amount).toLocaleString() : '—'}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">{o.status ?? '—'}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
      )}

      {saved.length > 0 && (
        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-white">Saved homes</Text>
            <Link href="/(tabs)/saved" asChild>
              <TouchableOpacity>
                <Text className="text-xs font-semibold text-emerald-400">View all</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="mt-3 gap-4">
            {saved.map((p) => (
              <PropertyCard
                key={p.id}
                id={p.property_id}
                title={p.title}
                address={p.address}
                city={p.city}
                state={p.state}
                price={p.price}
                beds={p.beds}
                baths={p.baths}
                sqft={p.sqft}
                imageUrl={p.image_url}
                saved
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
