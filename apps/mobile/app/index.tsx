import { useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 12;

type Property = {
  id: string | number;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  image_url?: string | null;
};

export default function Index() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace('/(tabs)/home');
        return;
      }

      const { data } = await supabase
        .from('properties')
        .select('id, title, address, city, state, price, beds, baths, sqft, image_url')
        .order('created_at', { ascending: false })
        .limit(8);

      setFeatured((data ?? []) as Property[]);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleBrowse = () => {
    router.push('/(tabs)/search');
  };

  const handleSearch = () => {
    router.push({ pathname: '/(tabs)/search', params: { q: searchQuery } });
  };

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-16">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <Text className="text-lg">🏠</Text>
            </View>
            <Text className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
              HomeBase
            </Text>
          </View>

          <Text className="mt-4 max-w-[320px] text-4xl font-bold leading-tight text-white">
            Find your dream home
          </Text>
          <Text className="mt-3 text-base text-slate-400">
            Search premium listings, schedule tours, and manage your portfolio—all in one place.
          </Text>

          <View className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="City, neighborhood, or ZIP"
              placeholderTextColor="#64748b"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              className="rounded-xl bg-slate-900/80 px-4 py-3 text-base text-slate-100"
            />
          </View>

          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              onPress={handleBrowse}
              className="flex-1 items-center justify-center rounded-2xl bg-emerald-500 py-3.5 shadow-lg shadow-emerald-500/30"
            >
              <Text className="text-base font-semibold text-slate-950">
                Browse Homes
              </Text>
            </TouchableOpacity>
            <Link href="/login" asChild>
              <TouchableOpacity className="flex-1 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 py-3.5">
                <Text className="text-base font-semibold text-slate-100">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View className="mt-12">
          <Text className="px-6 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Featured properties
          </Text>
          <Text className="mt-1 px-6 text-lg font-semibold text-white">
            Live from Supabase
          </Text>

          {loading ? (
            <View className="mt-4 h-52 items-center justify-center">
              <ActivityIndicator color="#22c55e" size="large" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                gap: CARD_MARGIN,
              }}
              className="mt-4"
            >
              {featured.map((p) => (
                <View
                  key={p.id}
                  style={{ width: CARD_WIDTH, marginRight: CARD_MARGIN }}
                >
                  <PropertyCard
                    id={p.id}
                    title={p.title}
                    address={p.address}
                    city={p.city}
                    state={p.state}
                    price={p.price}
                    beds={p.beds}
                    baths={p.baths}
                    sqft={p.sqft}
                    imageUrl={p.image_url}
                  />
                </View>
              ))}
              {featured.length === 0 && !loading && (
                <View
                  style={{ width: CARD_WIDTH }}
                  className="mr-4 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 py-12"
                >
                  <Text className="text-center text-sm text-slate-500">
                    No featured properties yet.
                  </Text>
                  <Text className="mt-1 text-center text-xs text-slate-600">
                    Add listings in Supabase to see them here.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
