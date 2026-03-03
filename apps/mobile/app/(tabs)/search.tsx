import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 12;

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

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(params.q ?? '');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    let q = supabase
      .from('properties')
      .select('id, title, address, city, state, price, beds, baths, sqft, image_url')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const trimmed = searchQuery.trim();
    if (trimmed) {
      q = q.or(
        `address.ilike.%${trimmed}%,city.ilike.%${trimmed}%,state.ilike.%${trimmed}%,title.ilike.%${trimmed}%`
      );
    }

    const { data, error: fetchError } = await q;

    if (fetchError) {
      setError(fetchError.message);
      return [];
    }

    const list = (data ?? []) as Property[];
    if (list.length < PAGE_SIZE) setHasMore(false);
    return list;
  }, [searchQuery]);

  const load = useCallback(async (append = false) => {
    const offset = append ? page * PAGE_SIZE : 0;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const list = await fetchPage(offset, append);
    if (append) {
      setProperties((prev) => (offset === 0 ? list : [...prev, ...list]));
      setPage((p) => (offset === 0 ? 1 : p + 1));
    } else {
      setProperties(list);
      setPage(1);
      setHasMore(true);
    }
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, [fetchPage, page]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    load(false);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    load(true);
  }, [load, loadingMore, hasMore, loading]);

  useEffect(() => {
    load(false);
  }, [searchQuery]);

  if (loading && properties.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 pt-14">
      <View className="mb-4 px-6">
        <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Search
        </Text>
        <Text className="mt-2 text-2xl font-bold text-white">
          Browse homes
        </Text>
        <View className="mt-4 flex-row gap-3">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="City, address, ZIP..."
            placeholderTextColor="#64748b"
            onSubmitEditing={() => load(false)}
            returnKeyType="search"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-base text-slate-100"
          />
          <TouchableOpacity
            onPress={() => load(false)}
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3"
          >
            <Text className="text-sm font-semibold text-emerald-400">Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View className="mx-6 mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
          <Text className="text-sm text-rose-300">{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={properties}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View className="mb-4 px-6">
            <PropertyCard
              id={item.id}
              title={item.title}
              address={item.address}
              city={item.city}
              state={item.state}
              price={item.price}
              beds={item.beds}
              baths={item.baths}
              sqft={item.sqft}
              imageUrl={item.image_url}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22c55e"
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6">
              <ActivityIndicator color="#22c55e" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="py-16">
              <Text className="text-center text-slate-500">No properties found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
